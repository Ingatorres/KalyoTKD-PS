import React from 'react';
import { Category } from '../../types';
import kalyoLogo from '../../src/KalyoTKD.svg';

interface PyramidBracketProps {
  category: Category;
}

export const PyramidBracket: React.FC<PyramidBracketProps> = ({ category }) => {
    const phases = ['Final', 'Semifinal', 'Cuartos de Final', 'Octavos de Final', '16avos de Final'];

    if (!category || !category.pyramidMatches) {
        return <div className="h-screen w-screen bg-slate-900" />;
    }

    const matchesByPhase = phases.reduce((acc, phase) => {
        // Show all matches to maintain tree integrity, but we'll style BYEs differently
        const phaseMatches = (category.pyramidMatches || []).filter(m => m.phase === phase);
        if (phaseMatches.length > 0) {
            acc[phase] = phaseMatches;
        }
        return acc;
    }, {} as Record<string, any[]>);

    // Sort phases from 16avos to Final for the visual tree (left to right)
    const phaseOrder = Object.keys(matchesByPhase).sort((a, b) => phases.indexOf(b) - phases.indexOf(a));

    const MatchCard: React.FC<{ match: any; isLast: boolean }> = ({ match, isLast }) => {
        const blueWinner = match.winner === 'blue';
        const redWinner = match.winner === 'red';
        const isBYE = !!match.byeWinner;

        return (
            <div className={`border-2 rounded-2xl p-5 m-2 shadow-2xl w-80 relative overflow-hidden group transition-all duration-300 ${isBYE ? 'bg-slate-900/20 border-slate-800 opacity-40 grayscale' : 'bg-slate-800/80 border-slate-700/50 backdrop-blur-md hover:border-blue-500/50'}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/50 to-red-600/50 opacity-30 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isBYE ? 'BYE' : `Encuentro #${match.matchNumber}`}</p>
                    <span className="text-[10px] font-bold text-slate-600 italic">{match.phase}</span>
                </div>
                
                {/* Competitor Blue */}
                <div className={`flex justify-between items-center p-3 mb-2 rounded-xl transition-all duration-300 border ${blueWinner ? 'bg-blue-600/20 border-blue-500/50 shadow-lg translate-x-1' : 'bg-slate-900/40 border-white/5'}`}>
                    <span className={`font-black text-sm truncate max-w-[80%] ${blueWinner ? 'text-blue-400' : 'text-slate-400'}`}>
                        {match.competitorBlue?.name || (match.winnerTargetSlot === 'blue' ? 'Esperando...' : 'BYE')}
                    </span>
                    {blueWinner && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                </div>

                {/* Competitor Red */}
                <div className={`flex justify-between items-center p-3 rounded-xl transition-all duration-300 border ${redWinner ? 'bg-red-600/20 border-red-500/50 shadow-lg translate-x-1' : 'bg-slate-900/40 border-white/5'}`}>
                    <span className={`font-black text-sm truncate max-w-[80%] ${redWinner ? 'text-red-400' : 'text-slate-400'}`}>
                        {match.competitorRed?.name || (match.winnerTargetSlot === 'red' ? 'Esperando...' : 'BYE')}
                    </span>
                    {redWinner && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>}
                </div>

                {/* Connectors */}
                {!isLast && (
                    <div className="absolute -right-16 top-0 bottom-0 w-16 pointer-events-none">
                        <div className="absolute top-1/2 right-8 w-8 h-px bg-slate-700"></div>
                        <div className={`absolute right-8 w-px bg-slate-700 ${match.matchNumber % 2 === 1 ? 'top-1/2 h-[calc(50%+1rem)]' : 'bottom-1/2 h-[calc(50%+1rem)]'}`}></div>
                        {match.matchNumber % 2 === 1 && (
                            <div className="absolute top-[calc(100%+1rem)] right-0 w-8 h-px bg-slate-700"></div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden relative">
            {/* Background Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <img src={kalyoLogo} className="w-[50%]" alt="Watermark" />
            </div>

            <header className="bg-slate-900/80 backdrop-blur-xl py-6 px-12 shadow-2xl z-10 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <img src={kalyoLogo} className="h-16 w-auto" alt="Kalyo Logo" />
                    <div className="w-px h-12 bg-white/10 mx-2"></div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 uppercase">
                            Llave de Competencia
                        </h1>
                        <h2 className="text-xl text-blue-400 font-bold uppercase tracking-widest">{category.title}</h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sistema de Puntuación</p>
                    <p className="text-lg font-black text-white italic">Kalyo <span className="text-red-600">TKD</span></p>
                </div>
            </header>

            <div className="flex-grow overflow-x-auto overflow-y-hidden flex items-center p-12 space-x-20 scrollbar-hide relative z-10">
                {phaseOrder.map((phase, idx) => (
                    <div key={phase} className="flex flex-col h-full justify-center min-w-max">
                        <h3 className="text-2xl font-bold mb-8 text-center text-gray-300 uppercase tracking-wider border-b-2 border-gray-700 pb-2 mx-4">{phase}</h3>
                        <div className="flex flex-col justify-around flex-grow space-y-8">
                            {matchesByPhase[phase]
                                .sort((a, b) => a.matchNumber - b.matchNumber)
                                .map(match => (
                                    <MatchCard key={match.id} match={match} isLast={idx === phaseOrder.length - 1} />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
