import { Event, Category, CompetitionSystem, PyramidMatch, Competitor, Score } from './types';
import * as ExcelJS from 'exceljs';
import { sortCompetitors } from './src/scoring';
import { sortCategories } from './categorySorter';
import { saveFileToEventFolder } from './tauriFileSaver';

// --- Styling Constants ---
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }; // Blue
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
const SUB_HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }; // Light Blue
const BORDER_STYLE: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
};
const CENTER_ALIGNMENT: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };

const WINNER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // Light Green
const GOLD_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
const SILVER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
const BRONZE_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCD7F32' } };
const DISCARDED_FONT: Partial<ExcelJS.Font> = { color: { argb: 'FF888888' }, strike: true };


// --- Helper Functions ---

const calculateAverage = (scores: (number | null)[], numJudges: number): number => {
    const validScores = scores.filter(s => s !== null && s > 0) as number[];
    if (validScores.length === 0) return 0;

    if (numJudges < 5) { // For N=3, use all scores
        const sum = validScores.reduce((a, b) => a + b, 0);
        return isNaN(sum) || validScores.length === 0 ? 0 : sum / validScores.length;
    } else { // For N=5 or N=7, discard min and max
        if (validScores.length < 3) {
            const sum = validScores.reduce((a, b) => a + b, 0);
            return isNaN(sum) || validScores.length === 0 ? 0 : sum / validScores.length;
        }
        const sorted = [...validScores].sort((a, b) => a - b);
        const sliced = sorted.slice(1, -1);
        const sum = sliced.reduce((a, b) => a + b, 0);
        return isNaN(sum) || sliced.length === 0 ? 0 : sum / sliced.length;
    }
};

const calculateFinalScore = (score: Score | null | undefined, numJudges: number): number => {
    if (!score) return 0;
    const techAvg = calculateAverage(score.technical, numJudges);
    const presAvg = calculateAverage(score.presentation, numJudges);
    return techAvg + presAvg;
}

const getDiscardedScoreIndices = (scores: (number | null)[], numJudges: number): number[] => {
    const validScores = scores.filter(s => s !== null && s >= 0) as number[];
    if (numJudges < 5 || validScores.length < 3) {
        return [];
    }
    const sorted = [...validScores].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    if (min === max) {
        return [];
    }

    const minIndex = scores.indexOf(min);
    const maxIndex = scores.lastIndexOf(max);
    return [minIndex, maxIndex];
};

const addStyledHeader = (worksheet: ExcelJS.Worksheet, text: string) => {
    const row = worksheet.addRow([text]);
    row.font = { bold: true, size: 20, color: { argb: 'FF4F81BD' } };
    row.alignment = CENTER_ALIGNMENT;
    worksheet.mergeCells(row.number, 1, row.number, 5);
    worksheet.addRow([]); // Spacer
};

const autoFitColumns = (worksheet: ExcelJS.Worksheet) => {
    worksheet.columns.forEach(column => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const len = cell.value ? cell.value.toString().length : 0;
            if (len > maxLen) {
                maxLen = len;
            }
        });
        column.width = maxLen < 12 ? 12 : maxLen + 2;
    });
};

// --- Sheet Generation Functions ---

const createSummarySheet = (workbook: ExcelJS.Workbook, event: Event, category: Category) => {
    const sheet = workbook.addWorksheet('Resumen');
    addStyledHeader(sheet, 'Resumen del Evento y Categoría');

    const summaryData = [
        ['Evento:', event.name],
        ['Fecha:', event.date],
        ['Categoría:', category.title],
        ['Modalidad:', category.modality],
        ['División:', category.division],
        ['Sistema:', category.system],
        ['Jefe de Área:', event.areaChief],
        ['Área #:', event.areaNumber],
        ['Registrador:', event.registrarName],
    ];

    summaryData.forEach(row => {
        const r = sheet.addRow(row);
        r.getCell(1).font = { bold: true };
    });

    autoFitColumns(sheet);
};

const createDetailedScoresSheet = (workbook: ExcelJS.Workbook, category: Category, event: Event) => {
    const sheet = workbook.addWorksheet('Puntuaciones Detalladas');
    addStyledHeader(sheet, 'Puntuaciones por Juez');
    const numJudges = event.judges.length;

    category.scores.forEach(score => {
        const competitor = category.competitors.find(c => c.id === score.competitorId);
        sheet.addRow([`Competidor: ${competitor?.name || 'N/A'}`]).font = { bold: true };
        
        // P1
        if (score.poomsae1) {
            const p1Row = sheet.addRow(['Poomsae 1', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'AVG'].slice(0, numJudges + 2));
            p1Row.font = { bold: true };
            
            const techRow = sheet.addRow(['Técnica', ...score.poomsae1.technical, calculateAverage(score.poomsae1.technical, numJudges)]);
            const presRow = sheet.addRow(['Presentación', ...score.poomsae1.presentation, calculateAverage(score.poomsae1.presentation, numJudges)]);
        }
        
        // P2
        if (score.poomsae2) {
            const p2Row = sheet.addRow(['Poomsae 2', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'AVG'].slice(0, numJudges + 2));
            p2Row.font = { bold: true };
            
            const techRow2 = sheet.addRow(['Técnica', ...score.poomsae2.technical, calculateAverage(score.poomsae2.technical, numJudges)]);
            const presRow2 = sheet.addRow(['Presentación', ...score.poomsae2.presentation, calculateAverage(score.poomsae2.presentation, numJudges)]);
        }
        
        sheet.addRow([]); // Spacer
    });

    autoFitColumns(sheet);
};

const createPyramidSheet = (workbook: ExcelJS.Workbook, category: Category, event: Event) => {
    const sheet = workbook.addWorksheet('Encuentros Pirámide');
    addStyledHeader(sheet, 'Detalle de Encuentros (Pirámide)');
    const numJudges = event.judges.length;

    category.pyramidMatches.forEach(match => {
        sheet.addRow([`${match.phase} - Encuentro #${match.matchNumber}`]).font = { bold: true, size: 14 };
        const headerRow = sheet.addRow(['Color', 'Nombre', 'Delegación', 'T1', 'P1', 'T2', 'P2', 'Final']);
        headerRow.font = { bold: true };
        headerRow.fill = SUB_HEADER_FILL;

        const hasP2 = category.poomsaeConfig.count === 2;

        const processCompetitor = (competitor: Competitor | null, s1: Score | null | undefined, s2: Score | null | undefined, color: string) => {
            const stats1 = { t: s1 ? calculateAverage(s1.technical, numJudges) : 0, p: s1 ? calculateAverage(s1.presentation, numJudges) : 0 };
            const stats2 = { t: s2 ? calculateAverage(s2.technical, numJudges) : 0, p: s2 ? calculateAverage(s2.presentation, numJudges) : 0 };
            const final = hasP2 ? ((stats1.t + stats1.p) + (stats2.t + stats2.p)) / 2 : (stats1.t + stats1.p);

            const row = sheet.addRow([
                color,
                competitor?.name,
                competitor?.delegation,
                stats1.t.toFixed(2),
                stats1.p.toFixed(2),
                hasP2 ? stats2.t.toFixed(2) : '-',
                hasP2 ? stats2.p.toFixed(2) : '-',
                final.toFixed(2)
            ]);
            return row;
        };

        const blueRow = processCompetitor(match.competitorBlue || null, match.scoreBlueP1, match.scoreBlueP2, 'Azul');
        const redRow = processCompetitor(match.competitorRed || null, match.scoreRedP1, match.scoreRedP2, 'Rojo');

        if (match.winner === 'blue') { blueRow.fill = WINNER_FILL; blueRow.font = { bold: true }; }
        else if (match.winner === 'red') { redRow.fill = WINNER_FILL; redRow.font = { bold: true }; }
        sheet.addRow([]);
    });
    autoFitColumns(sheet);
};

const createFinalRankingSheet = (workbook: ExcelJS.Workbook, category: Category, event: Event) => {
    const sheet = workbook.addWorksheet('Clasificación Final');
    addStyledHeader(sheet, 'Clasificación Final de Competidores');

    const sortedCompetitorsData = sortCompetitors(category.scores, category.competitors, event.judges.length as 3 | 5 | 7, category.poomsaeConfig.count);
    
    sheet.addTable({
        name: `FinalRanking_${category.id.substring(0,8)}`,
        ref: 'A3',
        headerRow: true,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: [
            { name: 'Puesto' }, { name: 'Nombre' }, { name: 'Delegación' }, 
            { name: 'Técnica Final' }, { name: 'Presentación Final' }, { name: 'Puntaje Final' },
        ],
        rows: sortedCompetitorsData.map((c, i) => [
            i + 1, c.name, c.delegation, 
            (c.techAvg || 0).toFixed(2),
            (c.presAvg || 0).toFixed(2),
            (c.finalScore || 0).toFixed(2)
        ])
    });

    autoFitColumns(sheet);
};

// --- Main Export Functions ---

export const exportCategoryToExcel = async (event: Event, category: Category, targetDir?: string) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kalyo TKD Poomsaes Scoring';
    workbook.created = new Date();
    workbook.properties.date1904 = true;

    createSummarySheet(workbook, event, category);
    createDetailedScoresSheet(workbook, category, event);
    if (category.system === CompetitionSystem.Rounds) {
        createFinalRankingSheet(workbook, category, event);
    } else {
        createPyramidSheet(workbook, category, event);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Resultados_${category.title.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
    const uint8Array = new Uint8Array(buffer);

    await saveFileToEventFolder(event.name, fileName, uint8Array, targetDir);
};

export const exportEventToExcel = async (event: Event, targetDir?: string) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kalyo TKD Poomsaes Scoring';
    workbook.created = new Date();
    workbook.properties.date1904 = true;

    const mainSheet = workbook.addWorksheet('Resumen del Evento');
    addStyledHeader(mainSheet, `Reporte General del Evento: ${event.name}`);
    mainSheet.addRow(['Fecha:', event.date]);
    mainSheet.addRow(['Jefe de Área:', event.areaChief]);
    mainSheet.addRow(['Área #:', event.areaNumber]);
    mainSheet.addRow(['Registrador:', event.registrarName]);
    mainSheet.addRow([]);
    mainSheet.addRow(['Categorías Incluidas:']).font = { bold: true };
    const sortedCategories = sortCategories(event.categories);
    sortedCategories.forEach((cat, index) => {
        mainSheet.addRow([`${index + 1}.`, cat.title, cat.system]);
    });
    autoFitColumns(mainSheet);

    for (const category of sortedCategories) {
        const safeTitle = category.title.substring(0, 20).replace(/[^a-z0-9]/gi, '_');
        const rankingSheet = workbook.addWorksheet(`Ranking_${safeTitle}`);
        addStyledHeader(rankingSheet, `Clasificación: ${category.title}`);
        const sortedData = sortCompetitors(category.scores, category.competitors, event.judges.length as 3 | 5 | 7, category.poomsaeConfig.count);
        
        rankingSheet.addTable({
            name: `T_${category.id.substring(0,8)}`,
            ref: 'A3',
            headerRow: true,
            style: { theme: 'TableStyleMedium2', showRowStripes: true },
            columns: [
                { name: 'Puesto' }, { name: 'Nombre' }, { name: 'Delegación' }, 
                { name: 'Técnica' }, { name: 'Presentación' }, { name: 'Puntaje Final' }
            ],
            rows: sortedData.map((c, i) => [
                i + 1, c.name, c.delegation, (c.techAvg || 0).toFixed(2), (c.presAvg || 0).toFixed(2), (c.finalScore || 0).toFixed(2)
            ])
        });
        autoFitColumns(rankingSheet);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Informe_General_${event.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
    const uint8Array = new Uint8Array(buffer);

    await saveFileToEventFolder(event.name, fileName, uint8Array, targetDir);
};