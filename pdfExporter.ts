import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Event, Category, CompetitionSystem, PyramidMatch, Competitor, Score, PdfExportOptions } from './types';
import { sortCompetitors, calculatePoomsaeFinalScore, calculateAverage } from './src/scoring';
import { Canvg } from 'canvg';
import kalyoLogo from './src/KalyoTKD.svg';
import { saveFileToEventFolder } from './tauriFileSaver'; // Automated saving

// --- Constantes de Diseño ---
const PRIMARY_COLOR = '#3B82F6'; // Azul
const SECONDARY_COLOR = '#EF4444'; // Rojo
const TEXT_COLOR = '#1F2937'; // Gris oscuro
const HEADER_COLOR = '#FFFFFF';
const LOGO_HEIGHT = 20;
const LOGO_WIDTH = 20;

async function getLogoPngDataUrl(logoSource: string | File) {
    try {
        const imageText = typeof logoSource === 'string' 
            ? await (await fetch(logoSource)).text()
            : await logoSource.text();

        const canvas = new OffscreenCanvas(LOGO_WIDTH * 5, LOGO_HEIGHT * 5); // Use OffscreenCanvas for performance
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const v = await Canvg.from(ctx, imageText);
        await v.render();

        const blob = await canvas.convertToBlob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error fetching logo for PDF:", error);
        return null;
    }
}

// Función para añadir marca de agua
function addWatermark(doc: jsPDF, logoUrl: string | null) {
    if (!logoUrl) return;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const size = 100; // Tamaño grande para la marca de agua
    
    // Guardar estado actual
    doc.saveGraphicsState();
    
    // Configurar transparencia
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    
    // Dibujar logo centrado
    doc.addImage(logoUrl, 'PNG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size);
    
    // Restaurar estado
    doc.restoreGraphicsState();
}

function addHeader(doc: jsPDF, event: Event, options: PdfExportOptions, logos: { kalyo: string | null, event: string | null, organizer: string | null }) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Fondo sutil
    doc.setFillColor(243, 244, 246); // bg-gray-100
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Marca de agua
    if (logos.kalyo) {
        addWatermark(doc, logos.kalyo);
    }

    // Encabezado
    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(HEADER_COLOR);
    doc.text('Informe de Competencia', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text(event.name, pageWidth / 2, 23, { align: 'center' });

    // Logos Encabezado: Organizador (Izq) - Evento (Der)
    if (logos.organizer) {
        doc.addImage(logos.organizer, 'PNG', 15, 5, 20, 20);
    }
    if (logos.event) {
        doc.addImage(logos.event, 'PNG', pageWidth - 20 - 15, 5, 20, 20);
    }
}

function addFooter(doc: jsPDF, options: PdfExportOptions, logos: { organizer: string | null }) {
    const pageCount = (doc.internal as any).pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Informe creado con Kalyo TKD - Poomsaes Scoring', 15, doc.internal.pageSize.getHeight() - 10);

        if (options.author) {
            doc.text(`Generado por: ${options.author}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
        }
        // Organizer logo removed from footer as it is now in header logic (though user can add it back if desired, but request emphasized header)
        // Leaving author right aligned.

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
}

export const exportEventToPdf = async (event: Event, options: PdfExportOptions = {} as PdfExportOptions) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const kalyoLogoUrl = await getLogoPngDataUrl(kalyoLogo);
    const eventLogoUrl = options.eventLogo ? await getLogoPngDataUrl(options.eventLogo) : null;
    const organizerLogoUrl = options.organizerLogo ? await getLogoPngDataUrl(options.organizerLogo) : null;
    const logos = { kalyo: kalyoLogoUrl, event: eventLogoUrl, organizer: organizerLogoUrl };

    // --- Página de Resumen ---
    addHeader(doc, event, options, logos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_COLOR);
    doc.setFontSize(12);

    let finalY = 40;

    autoTable(doc, {
        startY: finalY,
        body: [
            ['Fecha:', event.date],
            ['Lugar:', `Área #${event.areaNumber}`],
            ['Jefe de Área:', event.areaChief],
            ['Registrador:', event.registrarName],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    finalY = (doc as any).lastAutoTable.finalY + 5;

    if (options.includeJudges) {
        autoTable(doc, {
            startY: finalY,
            head: [['Jueces']],
            body: event.judges.map((j, i) => [`Juez #${i + 1}: ${j.name}`]),
            theme: 'striped',
            headStyles: { fillColor: PRIMARY_COLOR },
        });
        finalY = (doc as any).lastAutoTable.finalY + 5;
    }

    if (options.includeSummary) {
        const totalCompetitors = event.categories.reduce((sum, cat) => sum + cat.competitors.length, 0);
        const totalMatches = event.categories.reduce((sum, cat) => sum + cat.pyramidMatches.length, 0);

        autoTable(doc, {
            startY: finalY,
            head: [['Resumen General']],
            body: [
                ['Total de Categorías:', event.categories.length],
                ['Total de Competidores:', totalCompetitors],
                ['Total de Encuentros (Pirámide):', totalMatches],
            ],
            theme: 'grid',
            headStyles: { fillColor: SECONDARY_COLOR },
        });
    }

    // --- Páginas de Categorías ---
    const categoriesToExport = options.selectedCategoryIds 
        ? event.categories.filter(c => options.selectedCategoryIds?.includes(c.id))
        : event.categories;

    for (const category of categoriesToExport) {
        doc.addPage();
        addHeader(doc, event, options, logos);

        doc.setFontSize(16);
        doc.setTextColor(TEXT_COLOR);
        doc.text(category.title, 15, 40);

        doc.setFontSize(11);
        const poomsaeCountText = category.poomsaeConfig.count > 0 ? ` | ${category.poomsaeConfig.count} Poomsae(s)` : '';
        doc.text(`Sistema: ${category.system} | Competidores: ${category.competitors.length}${poomsaeCountText}`, 15, 48);

        let categoryFinalY = 55;

        if (category.system === CompetitionSystem.Rounds) {
            const sorted = sortCompetitors(category.scores, category.competitors, event.judges.length as 3 | 5 | 7, category.poomsaeConfig.count);
            autoTable(doc, {
                startY: categoryFinalY,
                head: [['Puesto', 'Nombre', 'Delegación', 'P. Técnica', 'P. Presentación', 'Puntaje Final']],
                body: sorted.map((c, i) => [
                    i + 1,
                    c.name,
                    c.delegation,
                    (c.techAvg || 0).toFixed(2),
                    (c.presAvg || 0).toFixed(2),
                    (c.finalScore || 0).toFixed(2)
                ]),
                theme: 'grid',
                headStyles: { fillColor: PRIMARY_COLOR },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.row.index < 3) {
                        data.cell.styles.fillColor = '#FEF9C3'; // Amarillo claro para el podio
                    }
                }
            });

            if (options.includeMatchDetails && category.poomsaeConfig.count > 1) {
                categoryFinalY = (doc as any).lastAutoTable.finalY + 10;
                doc.text('Desglose de Puntajes por Poomsae:', 15, categoryFinalY);
                categoryFinalY += 5;

                for (const c of sorted) {
                    const competitor = category.competitors.find(comp => comp.id === c.id);
                    const scores = category.scores.find(s => s.competitorId === c.id);
                    if (!competitor || !scores) continue;

                    const p1Tech = scores.poomsae1 ? calculateAverage(scores.poomsae1.technical, event.judges.length) : 0;
                    const p1Pres = scores.poomsae1 ? calculateAverage(scores.poomsae1.presentation, event.judges.length) : 0;
                    const p1Final = scores.poomsae1 ? p1Tech + p1Pres : 0;

                    const p2Tech = scores.poomsae2 ? calculateAverage(scores.poomsae2.technical, event.judges.length) : 0;
                    const p2Pres = scores.poomsae2 ? calculateAverage(scores.poomsae2.presentation, event.judges.length) : 0;
                    const p2Final = scores.poomsae2 ? p2Tech + p2Pres : 0;

                    autoTable(doc, {
                        startY: categoryFinalY,
                        head: [[`Competidor: ${c.name}`]],
                        body: [
                            ['Poomsae 1', p1Tech.toFixed(2), p1Pres.toFixed(2), p1Final.toFixed(2)],
                            ['Poomsae 2', p2Tech.toFixed(2), p2Pres.toFixed(2), p2Final.toFixed(2)],
                        ],
                        columns: [{header: 'Detalle'}, {header: 'Técnica'}, {header: 'Presentación'}, {header: 'Parcial'}]
                    });
                    categoryFinalY = (doc as any).lastAutoTable.finalY + 5;
                }
            }
        } else { // Pirámide
            const finalMatch = category.pyramidMatches.find(m => m.phase === 'Final');

            let first: Competitor | null = null, second: Competitor | null = null, third: Competitor | null = null;

            if (finalMatch?.winner) {
                first = finalMatch.winner === 'blue' ? finalMatch.competitorBlue : finalMatch.competitorRed;
                second = finalMatch.winner === 'blue' ? finalMatch.competitorRed : finalMatch.competitorBlue;

                const semifinalMatches = category.pyramidMatches.filter(m => m.phase === 'Semifinal');
                const loserToChampionMatch = semifinalMatches.find(m => (m.winner === 'blue' ? m.competitorBlue?.id : m.competitorRed?.id) === first?.id);
                if (loserToChampionMatch) {
                    third = loserToChampionMatch.winner === 'blue' ? loserToChampionMatch.competitorRed : loserToChampionMatch.competitorBlue;
                }
            }

            const getWinningScore = (competitor: Competitor | null, place: number): { t: string, p: string, f: string } => {
                if (!competitor) return { t: '-', p: '-', f: '-' };
                
                let targetMatch = null;
                if (place === 1 || place === 2) {
                    targetMatch = category.pyramidMatches.find(m => m.phase === 'Final');
                } else { // 3rd provided by logic
                    targetMatch = category.pyramidMatches.find(m => m.phase === 'Semifinal' && (m.competitorBlue?.id === competitor.id || m.competitorRed?.id === competitor.id));
                }

                if (!targetMatch) return { t: '-', p: '-', f: '-' };

                const isBlue = targetMatch.competitorBlue?.id === competitor.id;
                const sP1 = isBlue ? targetMatch.scoreBlueP1 : targetMatch.scoreRedP1;
                const sP2 = isBlue ? targetMatch.scoreBlueP2 : targetMatch.scoreRedP2;

                const calcAvg = (scores: (number | null)[]) => {
                     // Using imported calculateAverage would be cleaner if it handles nulls/filters same way as intended logic
                     // calculateAverage in scoring.ts handles it.
                     if (!scores) return 0;
                     return calculateAverage(scores, event.judges.length);
                };

                const t1 = sP1 && sP1.technical ? calcAvg(sP1.technical) : 0;
                const p1 = sP1 && sP1.presentation ? calcAvg(sP1.presentation) : 0;
                const t2 = sP2 && sP2.technical ? calcAvg(sP2.technical) : 0;
                const p2 = sP2 && sP2.presentation ? calcAvg(sP2.presentation) : 0;

                let tech = 0, pres = 0, final = 0;
                if (category.poomsaeConfig.count === 2) {
                    tech = (t1 + t2) / 2;
                    pres = (p1 + p2) / 2;
                    final = ((t1 + p1) + (t2 + p2)) / 2;
                } else {
                    tech = t1;
                    pres = p1;
                    final = t1 + p1;
                }
                return { t: tech.toFixed(2), p: pres.toFixed(2), f: final.toFixed(2) };
            };

            const podioBody = [];
            if (first) {
                const s = getWinningScore(first, 1);
                podioBody.push(['1° (Oro)', first.name, first.delegation || '', s.t, s.p, s.f]);
            }
            if (second) {
                const s = getWinningScore(second, 2);
                podioBody.push(['2° (Plata)', second.name, second.delegation || '', s.t, s.p, s.f]);
            }
            if (third) {
                const s = getWinningScore(third, 3);
                podioBody.push(['3° (Bronce)', third.name, third.delegation || '', s.t, s.p, s.f]);
            }

            autoTable(doc, {
                startY: categoryFinalY,
                head: [['Puesto', 'Nombre', 'Delegación', 'Técnica', 'Presentación', 'Final']],
                body: podioBody,
                theme: 'grid',
                headStyles: { fillColor: PRIMARY_COLOR },
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        if (data.row.index === 0) data.cell.styles.fillColor = '#FEF9C3'; // Oro
                        if (data.row.index === 1) data.cell.styles.fillColor = '#E5E7EB'; // Plata
                        if (data.row.index === 2) data.cell.styles.fillColor = '#FDE68A'; // Bronce
                    }
                }
            });
            categoryFinalY = (doc as any).lastAutoTable.finalY + 10;

            if (options.includeMatchDetails) {
                doc.text('Desglose de Encuentros:', 15, categoryFinalY);
                categoryFinalY += 5;

                const getScoreDetails = (score?: Score | null) => {
                    if (!score) return { tech: 'N/A', pres: 'N/A', final: 'N/A' };
                    const tech = calculateAverage(score.technical, event.judges.length);
                    const pres = calculateAverage(score.presentation, event.judges.length);
                    return { tech: tech.toFixed(2), pres: pres.toFixed(2), final: (tech + pres).toFixed(2) };
                };

                category.pyramidMatches.forEach(match => {
                    if (!match.competitorBlue || !match.competitorRed) return;

                    const winnerName = match.winner === 'blue' ? match.competitorBlue.name : match.competitorRed.name;

                    const p1Blue = getScoreDetails(match.scoreBlueP1);
                    const p2Blue = getScoreDetails(match.scoreBlueP2);
                    const p1Red = getScoreDetails(match.scoreRedP1);
                    const p2Red = getScoreDetails(match.scoreRedP2);

                    autoTable(doc, {
                        startY: categoryFinalY,
                        head: [[`Encuentro #${match.matchNumber} - ${match.phase} | Ganador: ${winnerName}`]],
                        body: [
                            [{ content: `Azul: ${match.competitorBlue.name}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: '#DBEAFE' } }],
                            ['Poomsae 1', p1Blue.tech, p1Blue.pres, p1Blue.final],
                            ['Poomsae 2/Des.', p2Blue.tech, p2Blue.pres, p2Blue.final],
                            [{ content: `Rojo: ${match.competitorRed.name}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: '#FEE2E2' } }],
                            ['Poomsae 1', p1Red.tech, p1Red.pres, p1Red.final],
                            ['Poomsae 2/Des.', p2Red.tech, p2Red.pres, p2Red.final],
                        ],
                        columns: [{header: 'Detalle'}, {header: 'Técnica'}, {header: 'Presentación'}, {header: 'Parcial'}],
                    });
                    categoryFinalY = (doc as any).lastAutoTable.finalY + 5;
                });
            }
        }
    }

    // --- Footer ---
    addFooter(doc, options, logos);

    // --- Save File ---
    const fileName = `Informe_${event.name.replace(/ /g, '_')}.pdf`;
    
    // Check if running in Tauri
    // @ts-ignore
    if (window.__TAURI__) {
        try {
            const pdfOutput = doc.output('arraybuffer');
            const uint8Array = new Uint8Array(pdfOutput);
            const savedPath = await saveFileToEventFolder(event.name, fileName, uint8Array);

            if (savedPath) {
                console.log(`PDF guardado automáticamente en: ${savedPath}`);
                alert(`Informe PDF guardado exitosamente en: ${savedPath}`);
            } else {
                alert('Error al guardar el informe PDF automáticamente.');
            }
        } catch (error) {
            console.error("Error al guardar PDF en Tauri:", error);
            alert('Error crítico al guardar PDF: ' + JSON.stringify(error));
        }
    } else {
        doc.save(fileName);
    }
};