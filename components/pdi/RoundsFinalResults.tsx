
import React from 'react';

interface DisplayScore {
  id: string;
  name: string;
  delegation: string;
  techAvg: number;
  presAvg: number;
  finalScore: number;
}

interface RoundsFinalResultsProps {
  categoryTitle: string;
  displayScores?: DisplayScore[];
}

export const RoundsFinalResults: React.FC<RoundsFinalResultsProps> = ({ categoryTitle, displayScores = [] }) => {
    // The scores are sorted descending in the parent component.
    const sortedScores = displayScores;
    const top4 = sortedScores.slice(0, 4);
    
    // Reorder for Podium: 2nd, 1st, 3rd. 4th is separate or next to 3rd.
    // We want the visual order: 2, 1, 3.
    // But we need to handle cases with < 3 competitors too.
    
    const first = top4[0];
    const second = top4[1];
    const third = top4[2];
    const fourth = top4[3];

    return (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex flex-col items-center justify-center p-8 overflow-hidden relative">
            {/* Background Particles/Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="text-center mb-8 z-10 animate-fade-in-down">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-500 drop-shadow-lg">
                    RESULTADOS FINALES
                </h1>
                <h2 className="text-2xl md:text-4xl text-gray-300 mt-4 font-light tracking-wide uppercase">{categoryTitle}</h2>
            </div>
            
            <div className="flex-grow flex flex-col items-center justify-center w-full max-w-7xl z-10 h-full max-h-screen pb-4">
                {/* Podium Row */}
                <div className="flex items-end justify-center w-full gap-2 md:gap-4 mb-2 flex-grow">
                    
                    {/* 2nd Place (Left) */}
                    {second && (
                        <div className="flex flex-col items-center w-1/4 animate-slide-up-delayed-1">
                            <div className="mb-2 text-center">
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-gray-300 bg-gray-800 flex items-center justify-center shadow-lg mx-auto mb-1 overflow-hidden relative">
                                    <span className="text-2xl md:text-4xl">🥈</span>
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[180px]">{second.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{second.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-gray-700 to-gray-500 rounded-t-lg shadow-2xl flex flex-col justify-end items-center h-32 md:h-48 relative group">
                                <div className="absolute top-0 w-full h-1 bg-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                                <div className="mb-2 md:mb-6 text-center">
                                    <span className="text-2xl md:text-4xl font-black text-white drop-shadow-md">{(second.finalScore || 0).toFixed(2)}</span>
                                    <div className="text-[10px] md:text-xs text-gray-300 mt-0.5 flex justify-center gap-2">
                                        <span>T: {(second.techAvg || 0).toFixed(2)}</span>
                                        <span>P: {(second.presAvg || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-4xl md:text-5xl font-black text-white/10 absolute bottom-2">2</div>
                            </div>
                        </div>
                    )}

                    {/* 1st Place (Center-Left) */}
                    {first && (
                        <div className="flex flex-col items-center w-1/4 z-20 animate-slide-up">
                            <div className="mb-4 text-center transform scale-110">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-400 bg-gray-800 flex items-center justify-center shadow-2xl mx-auto mb-1 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-yellow-500 opacity-20 animate-pulse"></div>
                                    <span className="text-4xl md:text-5xl">🥇</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-yellow-400 truncate max-w-[150px] md:max-w-[220px]">{first.name}</h3>
                                <p className="text-yellow-200 text-xs md:text-sm truncate max-w-[150px] md:max-w-[220px]">{first.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-lg shadow-[0_0_50px_rgba(234,179,8,0.4)] flex flex-col justify-end items-center h-48 md:h-64 relative">
                                <div className="absolute top-0 w-full h-1 bg-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]"></div>
                                <div className="mb-4 md:mb-8 text-center">
                                    <span className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">{(first.finalScore || 0).toFixed(2)}</span>
                                    <div className="text-xs md:text-sm text-yellow-100 mt-1 flex justify-center gap-3 font-bold">
                                        <span>T: {(first.techAvg || 0).toFixed(2)}</span>
                                        <span>P: {(first.presAvg || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-6xl md:text-7xl font-black text-white/20 absolute bottom-4">1</div>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place (Center-Right) */}
                    {third && (
                        <div className="flex flex-col items-center w-1/4 animate-slide-up-delayed-2">
                            <div className="mb-2 text-center">
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-orange-400 bg-gray-800 flex items-center justify-center shadow-lg mx-auto mb-1 overflow-hidden relative">
                                    <span className="text-2xl md:text-4xl">🥉</span>
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[180px]">{third.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{third.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-orange-800 to-orange-600 rounded-t-lg shadow-2xl flex flex-col justify-end items-center h-24 md:h-40 relative">
                                <div className="absolute top-0 w-full h-1 bg-orange-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                                <div className="mb-2 md:mb-4 text-center">
                                    <span className="text-2xl md:text-4xl font-black text-white drop-shadow-md">{(third.finalScore || 0).toFixed(2)}</span>
                                    <div className="text-[10px] md:text-xs text-orange-100 mt-0.5 flex justify-center gap-2">
                                        <span>T: {(third.techAvg || 0).toFixed(2)}</span>
                                        <span>P: {(third.presAvg || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-4xl md:text-5xl font-black text-white/10 absolute bottom-2">3</div>
                            </div>
                        </div>
                    )}

                    {/* 4th Place (Right) - Same style as 3rd */}
                    {fourth && (
                        <div className="flex flex-col items-center w-1/4 animate-slide-up-delayed-2">
                            <div className="mb-2 text-center">
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-orange-400 bg-gray-800 flex items-center justify-center shadow-lg mx-auto mb-1 overflow-hidden relative">
                                    <span className="text-2xl md:text-4xl">🥉</span>
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[180px]">{fourth.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{fourth.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-orange-800 to-orange-600 rounded-t-lg shadow-2xl flex flex-col justify-end items-center h-24 md:h-40 relative">
                                <div className="absolute top-0 w-full h-1 bg-orange-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                                <div className="mb-2 md:mb-4 text-center">
                                    <span className="text-2xl md:text-4xl font-black text-white drop-shadow-md">{(fourth.finalScore || 0).toFixed(2)}</span>
                                    <div className="text-[10px] md:text-xs text-orange-100 mt-0.5 flex justify-center gap-2">
                                        <span>T: {(fourth.techAvg || 0).toFixed(2)}</span>
                                        <span>P: {(fourth.presAvg || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-4xl md:text-5xl font-black text-white/10 absolute bottom-2">4</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-slide-up-delayed-1 {
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
                    opacity: 0;
                }
                .animate-slide-up-delayed-2 {
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
                    opacity: 0;
                }
                @keyframes fadeInDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in-down {
                    animation: fadeInDown 0.8s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out 1s forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
};
