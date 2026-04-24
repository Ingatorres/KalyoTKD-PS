import React from 'react';
import { PyramidMatch, Judge, Score } from '../types';
import { ScoreInput } from './ScoreInput';

interface PyramidLiveScoringProps {
  match: PyramidMatch;
  judges: Judge[];
  onScoreChange: (competitorId: string, poomsaeIndex: number, judgeIndex: number, scoreType: 'technical' | 'presentation', value: number | null) => void;
  onDeclareWinner: (winner: 'blue' | 'red' | 'tie') => void;
  isTieBreak: boolean;
}

export const PyramidCompetitorPanel: React.FC<{
    competitor: any;
    color: 'blue' | 'red';
    judges: Judge[];
    scoresP1: Score | null | undefined;
    scoresP2: Score | null | undefined;
    poomsaeCount: number;
    numJudges: 3 | 5 | 7;
    currentPoomsaeIndex: number;
    onScoreChange: (competitorId: string, poomsaeIndex: number, judgeIndex: number, scoreType: 'technical' | 'presentation', value: number | null) => void;
}> = ({ competitor, color, judges, scoresP1, scoresP2, poomsaeCount, numJudges, currentPoomsaeIndex, onScoreChange }) => {
    if (!competitor) return null;

    // Import calculateAverage and calculatePoomsaeFinalScore
    const calculateAverage = (scores: (number | null)[], numJudges: number): number => {
        const validScores = scores.filter(s => s !== null && s >= 0) as number[];
        if (validScores.length === 0) return 0;

        let evaluatedScores = validScores;
        if (numJudges >= 5 && validScores.length >= 3) {
            const sorted = [...validScores].sort((a, b) => a - b);
            evaluatedScores = sorted.slice(1, -1); // Discard min and max
        }

        const sum = evaluatedScores.reduce((a, b) => a + b, 0);
        return sum / evaluatedScores.length;
    };

    const calculatePoomsaeFinalScore = (score: Score | null | undefined): number => {
        if (!score || !score.technical || !score.presentation) return 0;
        const techAvg = calculateAverage(score.technical, numJudges);
        const presAvg = calculateAverage(score.presentation, numJudges);
        return techAvg + presAvg;
    };

    // Calculate scores
    const p1Score = calculatePoomsaeFinalScore(scoresP1);
    const p2Score = calculatePoomsaeFinalScore(scoresP2);
    const finalScore = poomsaeCount === 2 && p1Score > 0 && p2Score > 0 
        ? (p1Score + p2Score) / 2 
        : (p1Score || p2Score);

    // Use the current poomsae being scored
    const currentScores = currentPoomsaeIndex === 0 ? scoresP1 : scoresP2;

    const techAvg = currentScores ? calculateAverage(currentScores.technical, numJudges) : 0;
    const presAvg = currentScores ? calculateAverage(currentScores.presentation, numJudges) : 0;

    // Color scheme mappings
    const isBlue = color === 'blue';
    const theme = {
        bg: isBlue ? 'bg-blue-900/10' : 'bg-red-900/10',
        border: isBlue ? 'border-blue-500/30' : 'border-red-500/30',
        glow: isBlue ? 'shadow-[0_0_30px_rgba(37,99,235,0.15)]' : 'shadow-[0_0_30px_rgba(220,38,38,0.15)]',
        headerBg: isBlue ? 'bg-gradient-to-r from-blue-700 to-blue-500' : 'bg-gradient-to-r from-red-700 to-red-500',
        text: isBlue ? 'text-blue-400' : 'text-red-400',
        textLight: isBlue ? 'text-blue-200' : 'text-red-200',
        inputRing: isBlue ? 'focus:ring-blue-500 border-blue-500/50' : 'focus:ring-red-500 border-red-500/50',
        title: isBlue ? 'AZUL' : 'ROJO',
        panelBg: 'bg-slate-900/80 backdrop-blur-md'
    };

    return (
        <div className={`${theme.panelBg} ${theme.border} ${theme.glow} p-5 rounded-2xl border-2 relative overflow-hidden group flex flex-col h-full transition-all duration-300`}>
             {/* Dynamic background element */}
             <div className={`absolute top-0 right-0 w-64 h-64 ${isBlue ? 'bg-blue-600/10' : 'bg-red-600/10'} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none`}></div>
             
            {/* Header */}
            <div className={`${theme.headerBg} text-white p-4 rounded-xl mb-6 shadow-lg relative z-10 flex items-center justify-between`}>
                <div>
                    <h3 className="text-2xl font-black italic tracking-widest">{theme.title}</h3>
                    <p className="text-sm font-semibold opacity-90 truncate max-w-[200px] uppercase tracking-wider">{competitor.name}</p>
                    <p className="text-[10px] font-bold opacity-75 uppercase tracking-widest">{competitor.delegation}</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shrink-0">
                    <span className="text-2xl font-black">{competitor.name.charAt(0)}</span>
                </div>
            </div>

            {/* Score Summary Banner */}
            <div className="bg-black/40 rounded-xl mb-6 border border-white/5 relative z-10 flex overflow-hidden shadow-inner">
                <div className="flex-1 py-3 text-center border-r border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Poomsae 1</p>
                    <p className="text-xl font-black text-white">{p1Score.toFixed(2)}</p>
                </div>
                {poomsaeCount === 2 && (
                    <div className="flex-1 py-3 text-center border-r border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Poomsae 2</p>
                        <p className="text-xl font-black text-white">{p2Score.toFixed(2)}</p>
                    </div>
                )}
                <div className={`flex-[1.5] py-3 text-center ${isBlue ? 'bg-blue-900/20' : 'bg-red-900/20'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Puntaje Final</p>
                    <p className={`text-3xl font-black ${theme.text} drop-shadow-md`}>{finalScore.toFixed(2)}</p>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="relative z-10 flex-grow grid grid-cols-2 gap-4">
                {/* Technical Section */}
                <div className={`${theme.bg} p-4 rounded-xl border border-white/5 flex flex-col`}>
                    <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                        <h4 className={`font-black text-sm ${theme.text} uppercase tracking-widest`}>Técnica</h4>
                        <span className={`text-2xl font-black ${theme.text}`}>{techAvg.toFixed(2)}</span>
                    </div>
                    <div className="space-y-3 flex-grow">
                        {judges.map((judge, index) => (
                            <div key={`tech-${judge.id}`} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                <label className={`text-xs font-bold ${theme.textLight} w-8`}>J{index + 1}</label>
                                <ScoreInput
                                    initialValue={currentScores?.technical?.[index] ?? 0}
                                    onCommit={(value) => onScoreChange(competitor.id, currentPoomsaeIndex, index, 'technical', value)}
                                    className={`w-16 p-1.5 text-lg font-black text-center bg-black/40 text-white rounded border ${theme.inputRing} transition-colors`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Presentation Section */}
                <div className={`${theme.bg} p-4 rounded-xl border border-white/5 flex flex-col`}>
                    <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                        <h4 className={`font-black text-sm ${theme.text} uppercase tracking-widest`}>Present.</h4>
                        <span className={`text-2xl font-black ${theme.text}`}>{presAvg.toFixed(2)}</span>
                    </div>
                    <div className="space-y-3 flex-grow">
                        {judges.map((judge, index) => (
                            <div key={`pres-${judge.id}`} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                <label className={`text-xs font-bold ${theme.textLight} w-8`}>J{index + 1}</label>
                                <ScoreInput
                                    initialValue={currentScores?.presentation?.[index] ?? 0}
                                    onCommit={(value) => onScoreChange(competitor.id, currentPoomsaeIndex, index, 'presentation', value)}
                                     className={`w-16 p-1.5 text-lg font-black text-center bg-black/40 text-white rounded border ${theme.inputRing} transition-colors`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};

export const PyramidLiveScoring: React.FC<PyramidLiveScoringProps> = ({ match, judges, onScoreChange, onDeclareWinner, isTieBreak }) => {
  const poomsaeIndex = isTieBreak ? 1 : 0; // 0 for P1, 1 for P2/Tie-break
  return (
    <div className="space-y-8 pb-10">
        {/* Cinematic Header */}
        <div className="text-center bg-slate-900/50 p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Match #{match.matchNumber} &bull; {match.phase}</p>
            <div className="flex items-center justify-center gap-6">
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter truncate max-w-[40%]">{match.competitorBlue?.name || '---'}</h3>
                <span className="text-sm font-black text-slate-500 italic bg-black/40 px-3 py-1 rounded-full border border-white/5 shrink-0">VS</span>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter truncate max-w-[40%]">{match.competitorRed?.name || '---'}</h3>
            </div>
            {isTieBreak && (
                <div className="mt-4 inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase animate-pulse">
                    Desempate Activo
                </div>
            )}
        </div>
        
        {/* Competitor Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative">
            {/* Center VS Divider (Hidden on small screens) */}
            <div className="hidden lg:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none z-20">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-slate-500/30 to-transparent"></div>
                <div className="absolute bg-slate-950 border border-slate-700/50 text-slate-400 text-xs font-black p-3 rounded-full shadow-2xl backdrop-blur-md uppercase tracking-widest">
                    VS
                </div>
            </div>

            <PyramidCompetitorPanel 
                competitor={match.competitorBlue} 
                color="blue" 
                judges={judges} 
                scoresP1={match.scoreBlueP1} 
                scoresP2={match.scoreBlueP2} 
                poomsaeCount={2} 
                numJudges={judges.length as 3 | 5 | 7} 
                currentPoomsaeIndex={poomsaeIndex}
                onScoreChange={onScoreChange} 
            />
            <PyramidCompetitorPanel 
                competitor={match.competitorRed} 
                color="red" 
                judges={judges} 
                scoresP1={match.scoreRedP1} 
                scoresP2={match.scoreRedP2} 
                poomsaeCount={2} 
                numJudges={judges.length as 3 | 5 | 7} 
                currentPoomsaeIndex={poomsaeIndex}
                onScoreChange={onScoreChange} 
            />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 bg-slate-900/30 p-4 rounded-2xl border border-white/5">
            <button 
                onClick={() => onDeclareWinner('blue')} 
                className="flex-1 max-w-xs bg-gradient-to-r from-blue-700 to-blue-500 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-400 font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95"
            >
                Declarar Ganador Azul
            </button>
            <button 
                onClick={() => onDeclareWinner('red')} 
                className="flex-1 max-w-xs bg-gradient-to-r from-red-700 to-red-500 text-white py-4 px-6 rounded-xl hover:from-red-600 hover:to-red-400 font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105 active:scale-95"
            >
                Declarar Ganador Rojo
            </button>
        </div>
    </div>
  );
};