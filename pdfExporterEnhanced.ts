/**
 * pdfExporterEnhanced.ts
 *
 * Premium Single-Page PDF export for KalyoTKD pyramid brackets.
 * - Single Page per Category (Landscape).
 * - White Background.
 * - Professional white blocks with blue/red indicators.
 * - No competitor list table.
 */

import jsPDF from 'jspdf';
import { Event, Category, PyramidMatch, Score } from './types';
import { saveFileToEventFolder } from './tauriFileSaver';
import { calculateAverage, calculatePoomsaeFinalScore } from './src/scoring';

export interface PdfBracketExportOptions {
  eventLogo?: string;
  leagueLogo?: string;
  author?: string;
}

// ─── Colors ───────────────────────────────────────────────────────────
const BLUE_STROKE = [37, 99, 235];
const RED_STROKE = [185, 28, 28];
const TEXT_DARK = [31, 41, 55];
const GRAY_LINE = [209, 213, 219];
const MID_GRAY = [107, 114, 128];

/**
 * Shared drawing logic for a single category page.
 * This ensures consistency between single-category and multi-category exports.
 */
async function drawCategoryPage(
  doc: jsPDF,
  event: Event,
  category: Category,
  pyramidMatches: PyramidMatch[],
  options: PdfBracketExportOptions,
  yStart: number
): Promise<number> {
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 10;
  let y = yStart;

  // 1. Detection of Team Event
  const isTeamEvent = 
    category.division.toLowerCase().includes('pareja') || 
    category.division.toLowerCase().includes('equipo') || 
    category.title.toLowerCase().includes('pareja') || 
    category.title.toLowerCase().includes('equipo');

  // 2. Header
  const logoSize = 15;
  if (options.eventLogo) {
    try { doc.addImage(options.eventLogo, 'PNG', M, y, logoSize, logoSize); } catch (e) {}
  }
  if (options.leagueLogo) {
    try { doc.addImage(options.leagueLogo, 'PNG', PW - M - logoSize, y, logoSize, logoSize); } catch (e) {}
  }

  // Category Info
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(category.title.toUpperCase(), PW / 2, y + 6, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${event.name} | ${event.date} | Área #${event.areaNumber}`, PW / 2, y + 11, { align: 'center' });

  // Algorithmic Info Header
  const numCompetitors = category.competitors.length;
  const numPhases = Math.ceil(Math.log2(numCompetitors || 1));
  const basePower = Math.pow(2, numPhases);
  const byes = basePower - numCompetitors;

  doc.setFontSize(7);
  doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
  const algoInfo = `Número BASE: ${basePower} | Competidores Reales: ${numCompetitors} | BYEs: ${byes} | Regla: N+1 Balanceada`;
  doc.text(algoInfo, PW / 2, y + 16, { align: 'center' });

  y += 22;

  // 3. Bracket Drawing
  const availH = PH - y - 10;
  const availW = PW - M * 2;

  const phasesMap = groupMatchesByPhase(pyramidMatches);
  const phaseNames = Object.keys(phasesMap).sort((a, b) => phaseWeight(a) - phaseWeight(b));
  
  if (phaseNames.length === 0) {
    doc.text('No hay encuentros generados.', PW / 2, PH / 2, { align: 'center' });
  } else {
    const numCols = phaseNames.length;
    const colW = availW / numCols;
    
    // Dynamic Scaling based on columns and max matches
    const scaleFactor = numCols > 4 ? 0.7 : 1.0;
    const CARD_W = (colW - 6) * scaleFactor;
    const CARD_H = (numCols > 5 ? 12 : 16) * scaleFactor;
    const FONT_SIZE_NAME = (isTeamEvent ? (numCols > 5 ? 4 : 5) : (numCols > 5 ? 5 : 6)) * scaleFactor;
    const FONT_SIZE_DEL = (isTeamEvent ? (numCols > 5 ? 3 : 4) : (numCols > 5 ? 4 : 5)) * scaleFactor;
    const TRUNCATE_LEN = isTeamEvent ? 60 : 28;

    phaseNames.forEach((phase, colIdx) => {
      const matches = phasesMap[phase];
      const x = M + colIdx * colW + (colW - CARD_W) / 2;

      // Phase Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7 * scaleFactor);
      doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
      doc.text(phase.toUpperCase(), x + CARD_W / 2, y - 3, { align: 'center' });

      const slotH = availH / matches.length;

      matches.forEach((match, rowIdx) => {
        if (match.byeWinner) return; // Skip drawing the BYE card

        const cardY = y + rowIdx * slotH + (slotH - CARD_H) / 2;

        // Card block
        doc.setDrawColor(GRAY_LINE[0], GRAY_LINE[1], GRAY_LINE[2]);
        doc.setLineWidth(0.1);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, cardY, CARD_W, CARD_H, 0.5, 0.5, 'FD');

        // Competitor Blue
        const blueComp = match.competitorBlue;
        const blueName = blueComp?.name || (match.byeWinner ? 'BYE' : '---');
        const blueDel = blueComp?.delegation || '';

        // Blue indicator
        doc.setDrawColor(BLUE_STROKE[0], BLUE_STROKE[1], BLUE_STROKE[2]);
        doc.setLineWidth(0.6 * scaleFactor);
        doc.line(x, cardY, x, cardY + CARD_H / 2);
        
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        
        // Name Blue (Multiline support for teams)
        doc.setFontSize(FONT_SIZE_NAME);
        doc.setFont('helvetica', match.winner === 'blue' ? 'bold' : 'normal');
        const blueLines = doc.splitTextToSize(isTeamEvent ? blueName : truncate(blueName, TRUNCATE_LEN), CARD_W - 4);
        doc.text(blueLines, x + 2, cardY + (CARD_H / 4) - (blueLines.length > 1 ? 1 : 0));
        
        // Delegation Blue
        doc.setFontSize(FONT_SIZE_DEL);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        const blueDelY = cardY + (CARD_H / 4) + (blueLines.length > 1 ? 3 : 2.5);
        doc.text(truncate(blueDel, TRUNCATE_LEN + 10), x + 2, blueDelY);

        // Competitor Red
        const redComp = match.competitorRed;
        const redName = redComp?.name || (match.byeWinner ? 'BYE' : '---');
        const redDel = redComp?.delegation || '';

        // Red indicator
        doc.setDrawColor(RED_STROKE[0], RED_STROKE[1], RED_STROKE[2]);
        doc.setLineWidth(0.6 * scaleFactor);
        doc.line(x, cardY + CARD_H / 2, x, cardY + CARD_H);

        // Name Red (Multiline support for teams)
        doc.setFontSize(FONT_SIZE_NAME);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        doc.setFont('helvetica', match.winner === 'red' ? 'bold' : 'normal');
        const redLines = doc.splitTextToSize(isTeamEvent ? redName : truncate(redName, TRUNCATE_LEN), CARD_W - 4);
        doc.text(redLines, x + 2, cardY + (3 * CARD_H / 4) - (redLines.length > 1 ? 1 : 0));

        // Delegation Red
        doc.setFontSize(FONT_SIZE_DEL);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        const redDelY = cardY + (3 * CARD_H / 4) + (redLines.length > 1 ? 3 : 2.5);
        doc.text(truncate(redDel, TRUNCATE_LEN + 10), x + 2, redDelY);

        // Match #
        doc.setFontSize(4 * scaleFactor);
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        doc.text(`#${match.matchNumber}`, x + CARD_W - 2, cardY + 2.5, { align: 'right' });

        // Connectors
        if (colIdx < numCols - 1) {
            const nextX = x + CARD_W;
            const midY = cardY + CARD_H / 2;
            const nextColX = M + (colIdx + 1) * colW + (colW - CARD_W) / 2;
            const nextMatchIdx = Math.floor(rowIdx / 2);
            const nextSlotH = availH / (matches.length / 2);
            const nextMidY = y + nextMatchIdx * nextSlotH + nextSlotH / 2;

            doc.setDrawColor(GRAY_LINE[0], GRAY_LINE[1], GRAY_LINE[2]);
            doc.setLineWidth(0.1);
            doc.line(nextX, midY, nextX + (nextColX - nextX) / 2, midY);
            doc.line(nextX + (nextColX - nextX) / 2, midY, nextX + (nextColX - nextX) / 2, nextMidY);
            doc.line(nextX + (nextColX - nextX) / 2, nextMidY, nextColX, nextMidY);
        }
      });
    });
  }

  // Footer on each page
  doc.setFontSize(6);
  doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
  const authorText = options.author ? ` | Por: ${options.author}` : '';
  doc.text(`KalyoTKD Scoring System${authorText} | ${new Date().toLocaleString()}`, PW / 2, PH - 5, { align: 'center' });

  return PH;
}

export async function exportCategoryToPdf(
  event: Event,
  category: Category,
  pyramidMatches: PyramidMatch[],
  options: PdfBracketExportOptions = {},
  targetDir?: string
): Promise<void> {
  const doc = new jsPDF('l', 'mm', 'letter');
  await drawCategoryPage(doc, event, category, pyramidMatches, options, 10);

  const fileName = `${event.name}_${category.title}_Bracket.pdf`.replace(/[^a-z0-9]/gi, '_');
  
  // @ts-ignore
  if (window.__TAURI__) {
      try {
          const pdfOutput = doc.output('arraybuffer');
          const uint8Array = new Uint8Array(pdfOutput);
          await saveFileToEventFolder(event.name, fileName, uint8Array, targetDir);
      } catch (error) {
          console.error("Error al guardar PDF en Tauri:", error);
      }
  } else {
      doc.save(fileName);
  }
}

export async function exportMultipleCategoriesToPdf(
  event: Event,
  categories: Category[],
  options: PdfBracketExportOptions = {},
  targetDir?: string
): Promise<void> {
  const doc = new jsPDF('l', 'mm', 'letter');

  for (let i = 0; i < categories.length; i++) {
    if (i > 0) doc.addPage();
    const category = categories[i];
    const pyramidMatches = category.pyramidMatches || [];
    await drawCategoryPage(doc, event, category, pyramidMatches, options, 10);
  }

  const fileName = `Compilado_Pirámides_${event.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  
  // @ts-ignore
  if (window.__TAURI__) {
      try {
          const pdfOutput = doc.output('arraybuffer');
          const uint8Array = new Uint8Array(pdfOutput);
          await saveFileToEventFolder(event.name, fileName, uint8Array, targetDir);
      } catch (error) {
          console.error("Error al guardar PDF en Tauri:", error);
      }
  } else {
      doc.save(fileName);
  }
}

function groupMatchesByPhase(matches: PyramidMatch[]): Record<string, PyramidMatch[]> {
    const grouped: Record<string, PyramidMatch[]> = {};
    matches.forEach(m => {
        if (!grouped[m.phase]) grouped[m.phase] = [];
        grouped[m.phase].push(m);
    });
    return grouped;
}

const PHASE_ORDER = ['32avos de Final', '16avos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final'];
function phaseWeight(phase: string): number {
    const idx = PHASE_ORDER.indexOf(phase);
    return idx === -1 ? 99 : idx;
}

function truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.substring(0, maxLen - 1) + '...' : str;
}
