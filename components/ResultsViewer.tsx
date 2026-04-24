
import React, { useState } from 'react';
import { Category, Event, Screen, CompetitionSystem, CompetitorScore } from '../types';
import { Header } from './Header';
import { sortCompetitors, getTieBreakDetails } from '../src/scoring';
import { exportCategoryToExcel } from '../excelExporter';
import { exportCategoryToPdf, exportFinalResultsToPdf } from '../pdfExporterEnhanced';
import { exportCategoryToJson } from '../jsonExporter';
import { ExportChoiceModal } from './ExportChoiceModal';


interface ResultsViewerProps {
  event: Event;
  category: Category;
  setScreen: (screen: Screen) => void;
}

const RoundsResults: React.FC<{ category: Category, event: Event }> = ({ category, event }) => {
    const numJudges = event.judges.length as 3 | 5 | 7;
    const sortedScores = sortCompetitors(category.scores, category.competitors, numJudges, category.poomsaeConfig.count);


    return (
        <div className="bg-white/40 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none"></div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-6 drop-shadow-sm">Clasificación Final - Rondas</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                    <thead className="bg-slate-100 dark:bg-slate-900/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Puesto</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delegación</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Técnica</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Presentación</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Puntaje Final</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/50 dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-white/5">
                        {sortedScores.map((score, index) => {
                            const isTop3 = index < 3;
                            const rowClass = isTop3 
                                ? 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20' 
                                : 'hover:bg-slate-50 dark:hover:bg-white/5 transition-colors';
                            
                            const medalIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                            const badgeBg = index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 ring-1 ring-yellow-400/50'
                                : index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-slate-400/50'
                                : index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/50'
                                : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

                            return (
                                <tr key={score.id} className={rowClass}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeBg}`}>
                                            {medalIcon && <span className="text-base leading-none">{medalIcon}</span>}
                                            {index + 1}°
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{score.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{score.delegation || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-blue-600 dark:text-blue-300">{(score.techAvg || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-red-600 dark:text-red-300">{(score.presAvg || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-black text-green-600 dark:text-green-400 text-lg">{(score.finalScore || 0).toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import { getPyramidMedalWinners } from './PyramidFinalResults';

import { PyramidBracket } from './PyramidBracket';

const PyramidResults: React.FC<{ category: Category, event: Event }> = ({ category, event }) => {
    // Use the shared logic for medal winners
    const medalWinners = getPyramidMedalWinners(category.pyramidMatches || []);

    return (
        <div className="space-y-8">
            {category.status === 'completed' && (
                <div className="bg-white/40 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none"></div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-400 dark:to-amber-600 mb-6 drop-shadow-sm">Podio - Pirámide</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                            <thead className="bg-slate-100 dark:bg-slate-900/80">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Puesto</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Medalla</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delegación</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Técnica</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Presentación</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Final</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50 dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-white/5">
                                {medalWinners.map((winner, index) => {
                                    const numJudges = event.judges.length;

                                    // Score Calculation Logic
                                    let tech = 0;
                                    let pres = 0;
                                    let final = 0;

                                    if (winner.competitor) {
                                        let targetMatch = null;
                                        if (winner.place === 1 || winner.place === 2) {
                                           targetMatch = category.pyramidMatches.find(m => m.phase === 'Final');
                                        } else if (winner.place === 3 || winner.place === 4) {
                                            targetMatch = category.pyramidMatches.find(m => m.phase === 'Semifinal' && (m.competitorBlue?.id === winner.competitor?.id || m.competitorRed?.id === winner.competitor?.id));
                                        }

                                        if (targetMatch) {
                                            const isBlue = targetMatch.competitorBlue?.id === winner.competitor?.id;
                                            // Helper to calc single poomsae score (assuming implementation in helper or duplicate logic for now to ensure correctness)
                                            // Since we don't have direct access to 'calculateAverage' here easily without importing, I'll use the helper if exported or verify logic.
                                            // I will import `calculateFinalScore` and `calculateAverage` from `../src/scoring` which are exported?
                                            // Wait, `calculateFinalScore` is not exported in `scoring.ts` based on previous searches? Let me check `excelExporter` imports.
                                            // `excelExporter` IMPORTS `calculateAverage` from `./src/scoring`? No, it defines it LOCALLY in `excelExporter.ts` (lines 28-45).
                                            // `src/scoring.ts` likely has `calculateScores` but returns full object.
                                            // I should re-implement simple avg logic here or move to shared.
                                            // For now, I'll implement robust local calculation matching standard.
                                            
                                            const calcAvg = (scores: (number | null)[]) => {
                                                const valid = scores.filter(s => s !== null && s > 0) as number[];
                                                if (valid.length === 0) return 0;
                                                if (numJudges < 5) return valid.reduce((a,b)=>a+b,0) / valid.length;
                                                if (valid.length < 3) return valid.reduce((a,b)=>a+b,0) / valid.length;
                                                const sorted = [...valid].sort((a,b)=>a-b).slice(1, -1);
                                                return sorted.reduce((a,b)=>a+b,0) / sorted.length;
                                            }

                                            const sP1 = isBlue ? targetMatch.scoreBlueP1 : targetMatch.scoreRedP1;
                                            const sP2 = isBlue ? targetMatch.scoreBlueP2 : targetMatch.scoreRedP2;

                                            const t1 = sP1 ? calcAvg(sP1.technical) : 0;
                                            const p1 = sP1 ? calcAvg(sP1.presentation) : 0;
                                            const t2 = sP2 ? calcAvg(sP2.technical) : 0;
                                            const p2 = sP2 ? calcAvg(sP2.presentation) : 0;

                                            const hasP2 = category.poomsaeConfig.count === 2;
                                            
                                            if (hasP2) {
                                                tech = (t1 + t2) / 2;
                                                pres = (p1 + p2) / 2;
                                                // Final score in 2 poomsaes: ((t1+p1) + (t2+p2)) / 2  OR (t1+t2)/2 + (p1+p2)/2. Mathematically equivalent.
                                                final = ((t1 + p1) + (t2 + p2)) / 2;
                                            } else {
                                                tech = t1;
                                                pres = p1;
                                                final = t1 + p1;
                                            }
                                        }
                                    }

                                    const medalColorClass = winner.medal === 'Oro' ? 'text-yellow-500 dark:text-yellow-400' : winner.medal === 'Plata' ? 'text-slate-400 dark:text-gray-300' : winner.medal === 'Bronce' ? 'text-amber-600' : 'text-slate-400';
                                    const rowClass = 'hover:bg-slate-50 dark:hover:bg-white/5 transition-colors';

                                    const placeIcon = winner.place === 1 ? '🥇' : winner.place === 2 ? '🥈' : '🥉';
                                    const placeBg = winner.place === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 ring-1 ring-yellow-400/50'
                                        : winner.place === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-slate-400/50'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/50';

                                    return (
                                        <tr key={index} className={rowClass}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${placeBg}`}>
                                                    <span className="text-base leading-none">{placeIcon}</span>
                                                    {winner.place}°
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${medalColorClass} uppercase tracking-wider`}>{winner.medal}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{winner.competitor?.name || 'N/D'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{winner.competitor?.delegation || 'N/D'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-blue-600 dark:text-blue-300">{tech.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-red-600 dark:text-red-300">{pres.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-black text-green-600 dark:text-green-400 text-lg">{final.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-6 drop-shadow-sm">Llave de Competencia - Pirámide</h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-white/5 overflow-x-auto shadow-inner">
                    <PyramidBracket matches={category.pyramidMatches || []} />
                </div>
            </div>
        </div>
    );
};

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ event, category, setScreen }) => {
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  return (
    <div className="min-h-screen transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-10 pointer-events-none mix-blend-overlay"></div>
      <Header />
      <main className="max-w-6xl mx-auto py-8 px-6 relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/5 min-h-[80vh]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-white/10 pb-6 mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 drop-shadow-sm">Resultados: {category.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-widest">Evento: <span className="text-slate-900 dark:text-white">{event.name}</span></p>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setIsChoiceModalOpen(true)}
                        className="bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-400 font-bold py-2 px-6 rounded-lg hover:bg-green-600/20 dark:hover:bg-green-600/30 border border-green-500/20 dark:border-green-500/30 transition-all flex items-center gap-2 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exportar Resultados
                    </button>
                    <ExportChoiceModal 
                        isOpen={isChoiceModalOpen}
                        onClose={() => setIsChoiceModalOpen(false)}
                        onSelectPdf={() => exportCategoryToPdf(event, category, category.pyramidMatches || [])}
                        onSelectExcel={() => exportCategoryToExcel(event, category)}
                        onSelectJson={() => exportCategoryToJson(event, category)}
                        onSelectFinalResults={() => {
                            console.log("Click en Premiación desde ResultsViewer");
                            alert("Generando Reporte de Resultados Finales para esta categoría...");
                            exportFinalResultsToPdf(event, [category]).catch(err => {
                                console.error("Error en exportFinalResultsToPdf:", err);
                                alert("Error al generar PDF: " + err);
                            });
                        }}
                    />
                    <button 
                        onClick={() => {
                            // If the event is completed, go back to the events list, otherwise go to the category screen.
                            setScreen(event.status === 'completed' ? 'EXISTING_EVENTS' : 'CATEGORY');
                        }}
                        className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-bold transition-all border border-slate-300 dark:border-white/5"
                    >
                        &larr; Volver a Categorías
                    </button>
                </div>
            </div>

            <div className="mt-6">
                {category.system === CompetitionSystem.Rounds ? (
                    <RoundsResults category={category} event={event} />
                ) : (
                    <PyramidResults category={category} event={event} />
                )}
            </div>
        </div>
      </main>
    </div>
  );
};
