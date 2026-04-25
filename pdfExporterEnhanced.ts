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
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { Event, Category, PyramidMatch, Score, Competitor } from './types';
import { saveFileToEventFolder } from './tauriFileSaver';
import { calculateAverage, calculatePoomsaeFinalScore } from './src/scoring';

// Initialize autoTable plugin
applyPlugin(jsPDF);

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

interface MedalWinner {
    place: number;
    medal: 'Oro' | 'Plata' | 'Bronce';
    competitor: Competitor | null;
}

const getMedalWinners = (matches: PyramidMatch[]): MedalWinner[] => {
    // Find the final match: the one with no nextMatchId (root of the bracket)
    const finalMatch = matches.find(m => m.phase === 'Final') 
        ?? matches.find(m => !m.nextMatchId && !m.byeWinner);

    const winners: MedalWinner[] = [];

    if (!finalMatch || !finalMatch.winner) return winners;

    // 1st place: winner of the final
    const gold = finalMatch.winner === 'blue' ? finalMatch.competitorBlue : finalMatch.competitorRed;
    // 2nd place: loser of the final
    const silver = finalMatch.winner === 'blue' ? finalMatch.competitorRed : finalMatch.competitorBlue;

    winners.push({ place: 1, medal: 'Oro', competitor: gold });
    winners.push({ place: 2, medal: 'Plata', competitor: silver });

    // 3rd places: losers of the matches that feed directly into the final
    const semifeedMatches = matches.filter(m =>
        m.nextMatchId === finalMatch.id && !m.byeWinner
    );

    // Fallback: use phase name if no structural semifeeds found
    const semifinalMatches = semifeedMatches.length > 0
        ? semifeedMatches
        : matches.filter(m => m.phase === 'Semifinal' && !m.byeWinner);

    const bronzeIds = new Set<string>();
    semifinalMatches.forEach(match => {
        if (match.winner) {
            const loser = match.winner === 'blue' ? match.competitorRed : match.competitorBlue;
            if (loser && !bronzeIds.has(loser.id) && loser.id !== silver?.id && loser.id !== gold?.id) {
                winners.push({ place: 3, medal: 'Bronce', competitor: loser });
                bronzeIds.add(loser.id);
            }
        }
    });

    return winners;
};

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
    category.division.toLowerCase().includes('tk3') ||
    category.title.toLowerCase().includes('pareja') || 
    category.title.toLowerCase().includes('equipo') ||
    category.title.toLowerCase().includes('tk3');

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
  
  // Score calculation helper (mirrors excelExporter logic)
  const calcAvg = (scores: (number | null)[], numJudges: number): number => {
    const valid = scores.filter(s => s !== null && s >= 0) as number[];
    if (valid.length === 0) return 0;
    if (numJudges < 5 || valid.length < 3) return valid.reduce((a, b) => a + b, 0) / valid.length;
    const sorted = [...valid].sort((a, b) => a - b).slice(1, -1);
    return sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  };

  const numJudges = event.judges?.length ?? 3;
  const hasP2 = category.poomsaeConfig?.count === 2;

  const getCompScore = (match: PyramidMatch, side: 'blue' | 'red') => {
    const s1 = side === 'blue' ? match.scoreBlueP1 : match.scoreRedP1;
    const s2 = side === 'blue' ? match.scoreBlueP2 : match.scoreRedP2;
    const t1 = s1 ? calcAvg(s1.technical, numJudges) : 0;
    const p1 = s1 ? calcAvg(s1.presentation, numJudges) : 0;
    const t2 = s2 ? calcAvg(s2.technical, numJudges) : 0;
    const p2 = s2 ? calcAvg(s2.presentation, numJudges) : 0;
    if (hasP2) {
      return { t: (t1 + t2) / 2, p: (p1 + p2) / 2, total: ((t1 + p1) + (t2 + p2)) / 2 };
    }
    return { t: t1, p: p1, total: t1 + p1 };
  };

  const hasScores = (match: PyramidMatch): boolean => {
    const s = match.scoreBlueP1;
    return !!(s && s.technical && s.technical.some(v => v !== null && v > 0));
  };

  if (phaseNames.length === 0) {
    doc.text('No hay encuentros generados.', PW / 2, PH / 2, { align: 'center' });
  } else {
    const numCols = phaseNames.length;
    const colW = availW / numCols;
    
    // Dynamic Scaling based on columns and max matches
    const scaleFactor = numCols > 4 ? 0.7 : 1.0;
    const CARD_W = (colW - 6) * scaleFactor;
    // Taller cards to accommodate scores
    const CARD_H = (numCols > 5 ? 18 : 24) * scaleFactor;
    const HALF = CARD_H / 2;
    const FONT_SIZE_NAME = (isTeamEvent ? (numCols > 5 ? 4 : 5) : (numCols > 5 ? 5 : 6)) * scaleFactor;
    const FONT_SIZE_DEL = (isTeamEvent ? (numCols > 5 ? 3 : 4) : (numCols > 5 ? 4 : 5)) * scaleFactor;
    const FONT_SIZE_SCORE = 3.8 * scaleFactor;
    const TRUNCATE_LEN = isTeamEvent ? 60 : 26;

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
        const scored = hasScores(match);

        // Card block
        doc.setDrawColor(GRAY_LINE[0], GRAY_LINE[1], GRAY_LINE[2]);
        doc.setLineWidth(0.1);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, cardY, CARD_W, CARD_H, 0.5, 0.5, 'FD');

        // Divider line between blue and red halves
        doc.setDrawColor(GRAY_LINE[0], GRAY_LINE[1], GRAY_LINE[2]);
        doc.setLineWidth(0.15);
        doc.line(x, cardY + HALF, x + CARD_W, cardY + HALF);

        // Poomsae abbreviation on top right
        if (match.poomsaes && match.poomsaes.length > 0 && match.poomsaes[0]) {
          const poomsaeText = match.poomsaes.filter(Boolean).map(p => {
            const parts = (p as string).split(' ');
            return parts.length > 1 ? parts[parts.length - 1] : (p as string).substring(0, 6);
          }).join('/');
          doc.setFontSize(3.5 * scaleFactor);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
          doc.text(poomsaeText, x + CARD_W - 1.5, cardY + 3, { align: 'right' });
        }

        // === BLUE HALF ===
        doc.setDrawColor(BLUE_STROKE[0], BLUE_STROKE[1], BLUE_STROKE[2]);
        doc.setLineWidth(0.6 * scaleFactor);
        doc.line(x, cardY, x, cardY + HALF);

        const blueComp = match.competitorBlue;
        const blueName = blueComp?.name || '---';
        const blueDel = blueComp?.delegation || '';

        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        doc.setFontSize(FONT_SIZE_NAME);
        doc.setFont('helvetica', match.winner === 'blue' ? 'bold' : 'normal');
        const blueLines = doc.splitTextToSize(truncate(blueName, TRUNCATE_LEN), CARD_W - 5);
        const nameBlueY = cardY + 3.5;
        doc.text(blueLines, x + 2.5, nameBlueY);

        doc.setFontSize(FONT_SIZE_DEL);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        doc.text(truncate(blueDel, 22), x + 2.5, nameBlueY + 3);

        // Blue scores (only if scored)
        if (scored) {
          const bs = getCompScore(match, 'blue');
          doc.setFontSize(FONT_SIZE_SCORE);
          doc.setFont('helvetica', 'normal');
          // Score bar background
          doc.setFillColor(239, 246, 255);
          doc.rect(x + 0.5, cardY + HALF - 6, CARD_W - 1, 5.5, 'F');
          // Labels
          doc.setTextColor(BLUE_STROKE[0], BLUE_STROKE[1], BLUE_STROKE[2]);
          doc.text(`T:${bs.t.toFixed(2)}`, x + 2, cardY + HALF - 2.5);
          doc.text(`P:${bs.p.toFixed(2)}`, x + CARD_W * 0.38, cardY + HALF - 2.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text(`TOT:${bs.total.toFixed(2)}`, x + CARD_W * 0.66, cardY + HALF - 2.5);
        }

        // === RED HALF ===
        doc.setDrawColor(RED_STROKE[0], RED_STROKE[1], RED_STROKE[2]);
        doc.setLineWidth(0.6 * scaleFactor);
        doc.line(x, cardY + HALF, x, cardY + CARD_H);

        const redComp = match.competitorRed;
        const redName = redComp?.name || '---';
        const redDel = redComp?.delegation || '';

        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        doc.setFontSize(FONT_SIZE_NAME);
        doc.setFont('helvetica', match.winner === 'red' ? 'bold' : 'normal');
        const redLines = doc.splitTextToSize(truncate(redName, TRUNCATE_LEN), CARD_W - 5);
        const nameRedY = cardY + HALF + 3.5;
        doc.text(redLines, x + 2.5, nameRedY);

        doc.setFontSize(FONT_SIZE_DEL);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        doc.text(truncate(redDel, 22), x + 2.5, nameRedY + 3);

        // Red scores
        if (scored) {
          const rs = getCompScore(match, 'red');
          doc.setFontSize(FONT_SIZE_SCORE);
          doc.setFont('helvetica', 'normal');
          doc.setFillColor(255, 241, 242);
          doc.rect(x + 0.5, cardY + CARD_H - 6, CARD_W - 1, 5.5, 'F');
          doc.setTextColor(RED_STROKE[0], RED_STROKE[1], RED_STROKE[2]);
          doc.text(`T:${rs.t.toFixed(2)}`, x + 2, cardY + CARD_H - 2.5);
          doc.text(`P:${rs.p.toFixed(2)}`, x + CARD_W * 0.38, cardY + CARD_H - 2.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text(`TOT:${rs.total.toFixed(2)}`, x + CARD_W * 0.66, cardY + CARD_H - 2.5);
        }

        // Match # (top-left)
        doc.setFontSize(3.5 * scaleFactor);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
        doc.text(`#${match.matchNumber}`, x + 1.5, cardY + 2);

        // Winner star indicator
        if (match.winner) {
          const winnerY = match.winner === 'blue' ? cardY + HALF / 2 : cardY + HALF + HALF / 2;
          doc.setFillColor(251, 191, 36);
          doc.circle(x + CARD_W - 2, winnerY, 1.2, 'F');
        }

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

  // --- Podium Table (Bottom-Right Corner) ---
  // Always shown — even if unplayed, so user can fill in manually
  const winners = getMedalWinners(pyramidMatches);

  // Build a fixed 4-row structure: 1°, 2°, 3°, 3°
  const PLACE_DEFS = [
    { place: 1, label: 'ORO',    color: [218, 165, 32]  as [number,number,number] },
    { place: 2, label: 'PLATA',  color: [150, 150, 160] as [number,number,number] },
    { place: 3, label: 'BRONCE', color: [176, 112,  60] as [number,number,number] },
    { place: 3, label: 'BRONCE', color: [176, 112,  60] as [number,number,number] },
  ];

  // Fill winners into the 4 slots (one per place slot)
  const podiumRows = PLACE_DEFS.map((def, idx) => {
    const found = winners.filter(w => w.place === def.place)[idx === 3 ? 1 : 0];
    return { ...def, competitor: found?.competitor ?? null };
  });

  const PT = 0.7; // Podium table scale factor

  const tableW = 80 * PT;
  const tableX = PW - M - tableW;
  const rowH = 6 * PT;
  const headerH = 5 * PT;
  const colH = 5 * PT; // column-headers row height
  const TOTAL_ROWS = 4;
  const tableY = PH - M - headerH - colH - (TOTAL_ROWS * rowH) - 7;

  // Table outer background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(180, 195, 210);
  doc.setLineWidth(0.3);
  doc.roundedRect(tableX, tableY, tableW, headerH + colH + TOTAL_ROWS * rowH, 1.5, 1.5, 'FD');

  // Header bar
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(tableX, tableY, tableW, headerH, 1.5, 1.5, 'F');
  doc.setFillColor(30, 41, 59);
  doc.rect(tableX, tableY + 2, tableW, headerH - 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5 * PT);
  doc.text('PODIO DE PREMIACION', tableX + tableW / 2, tableY + 3.5 * PT, { align: 'center' });

  // Column headers row
  const col1X = tableX + 10 * PT;
  const col2X = tableX + 42 * PT;
  const col3X = tableX + tableW - 2 * PT;
  const colHeaderY = tableY + headerH;

  doc.setFillColor(220, 230, 242);
  doc.rect(tableX, colHeaderY, tableW, colH, 'F');
  doc.setTextColor(70, 90, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5 * PT);
  doc.text('NOMBRE', col1X, colHeaderY + 3.5 * PT);
  doc.text('DELEGACION', col2X, colHeaderY + 3.5 * PT);
  doc.text('MEDALLA', col3X, colHeaderY + 3.5 * PT, { align: 'right' });

  // Data rows
  podiumRows.forEach((row, i) => {
    const ry = tableY + headerH + colH + i * rowH;

    // Alternating row background
    doc.setFillColor(i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 252);
    doc.rect(tableX, ry, tableW, rowH, 'F');

    // Row divider
    doc.setDrawColor(210, 220, 230);
    doc.setLineWidth(0.15);
    doc.line(tableX, ry, tableX + tableW, ry);

    // Medal badge circle
    const badgeCX = tableX + 4.5 * PT;
    const badgeCY = ry + rowH / 2;
    const badgeR = 2.8 * PT;
    doc.setFillColor(row.color[0], row.color[1], row.color[2]);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4 * PT);
    doc.circle(badgeCX, badgeCY, badgeR, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4 * PT);
    doc.text(String(row.place), badgeCX, badgeCY + 1.3 * PT, { align: 'center' });

    if (row.competitor) {
      // Has data — show it
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.setFont('helvetica', row.place <= 2 ? 'bold' : 'normal');
      doc.setFontSize(5 * PT);
      doc.text(row.competitor.name.substring(0, 24), col1X, ry + rowH / 2 + 1.5 * PT);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
      doc.setFontSize(4.5 * PT);
      doc.text(row.competitor.delegation.substring(0, 14), col2X, ry + rowH / 2 + 1.5 * PT);
    } else {
      // Empty — draw a line for manual writing
      doc.setDrawColor(190, 200, 215);
      doc.setLineWidth(0.2);
      doc.line(col1X, ry + rowH - 1.5 * PT, col2X - 2 * PT, ry + rowH - 1.5 * PT);
      doc.line(col2X, ry + rowH - 1.5 * PT, col3X - 16 * PT, ry + rowH - 1.5 * PT);
    }

    // Medal label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(row.color[0], row.color[1], row.color[2]);
    doc.setFontSize(5 * PT);
    doc.text(row.label, col3X, ry + rowH / 2 + 1.5 * PT, { align: 'right' });
  });

  // Bottom border close
  doc.setDrawColor(180, 195, 210);
  doc.setLineWidth(0.3);

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
  const pdfOutput = doc.output('arraybuffer');
  const uint8Array = new Uint8Array(pdfOutput);
  await saveFileToEventFolder(event.name, fileName, uint8Array, targetDir);
}

export async function exportFinalResultsToPdf(
  event: Event,
  categories: Category[],
  options: PdfBracketExportOptions = {},
  targetDir?: string
): Promise<void> {
  console.log("exportFinalResultsToPdf: Iniciando con", categories.length, "categorías");
  try {
    if (!categories || categories.length === 0) {
      alert("Error: No hay categorías seleccionadas.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'letter');
  const PW = doc.internal.pageSize.getWidth();
  const M = 15;

  // Header
  let y = M;
  const logoSize = 20;
  if (options.eventLogo && typeof options.eventLogo === 'string') {
    try { doc.addImage(options.eventLogo, 'PNG', M, y, logoSize, logoSize); } catch (e) {}
  }
  if (options.leagueLogo && typeof options.leagueLogo === 'string') {
    try { doc.addImage(options.leagueLogo, 'PNG', PW - M - logoSize, y, logoSize, logoSize); } catch (e) {}
  }

  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('REPORTE DE RESULTADOS FINALES', PW / 2, y + 8, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(event.name.toUpperCase(), PW / 2, y + 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`${event.date} | Área #${event.areaNumber}`, PW / 2, y + 21, { align: 'center' });

  y += 30;

  // Table Data
  const tableRows: any[] = [];
  
  categories.forEach(category => {
    const winners = getMedalWinners(category.pyramidMatches || []);
    // Sort winners: 1st, 2nd, then 3rds
    const sortedWinners = winners.sort((a, b) => a.place - b.place);
    
    sortedWinners.forEach((w, idx) => {
      tableRows.push([
        idx === 0 ? category.title.toUpperCase() : '', // Only show category title on the first row of its group
        w.place === 1 ? '🥇 1er LUGAR' : w.place === 2 ? '🥈 2do LUGAR' : '🥉 3er LUGAR',
        w.competitor?.name || '---',
        w.competitor?.delegation || '---'
      ]);
    });
    
    // Add an empty separator row between categories
    tableRows.push([{ content: '', colSpan: 4, styles: { fillColor: [245, 245, 245], minCellHeight: 2 } }]);
  });

  console.log("Generando tabla con", tableRows.length, "filas");

  autoTable(doc, {
    startY: y,
    head: [['CATEGORÍA', 'PUESTO / MEDALLA', 'COMPETIDOR', 'DELEGACIÓN']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: 55 },
      3: { cellWidth: 40 }
    },
    margin: { left: M, right: M }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2]);
  const authorText = options.author ? ` | Por: ${options.author}` : '';
  doc.text(`KalyoTKD Scoring System${authorText} | Generado el ${new Date().toLocaleString()}`, PW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  const fileName = `Resultados_Finales_${event.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  
  const pdfOutput = doc.output('arraybuffer');
  const uint8Array = new Uint8Array(pdfOutput);
  await saveFileToEventFolder(event.name, fileName, uint8Array, targetDir);

 } catch (error) {
    console.error("Error crítico generando PDF de resultados:", error);
    alert("Error crítico generando PDF: " + error);
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
