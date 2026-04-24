import React from 'react';
import { PdiPyramidFinalResultsData } from '../../types';

export const PyramidFinalResultsScreen: React.FC<PdiPyramidFinalResultsData> = ({ categoryTitle, winners, modality }) => {
    // Winners are expected to be sorted by place: 1st, 2nd, 3rd, 3rd
    const first = winners.find(w => w.place === 1);
    const second = winners.find(w => w.place === 2);
    // Find both 3rd places
    const thirdPlaces = winners.filter(w => w.place === 3);
    const third = thirdPlaces[0];
    const fourth = thirdPlaces[1];

    const isTeamEvent = modality?.toLowerCase().includes('pareja') || modality?.toLowerCase().includes('equipo') || modality?.toLowerCase().includes('trio');

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
                                <h3 className="text-base md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[180px]">{isTeamEvent ? second.competitor?.delegation : second.competitor?.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{isTeamEvent ? second.competitor?.name : second.competitor?.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-gray-700 to-gray-500 rounded-t-lg shadow-2xl flex flex-col justify-end items-center h-32 md:h-48 relative group">
                                <div className="absolute top-0 w-full h-1 bg-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
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
                                <h3 className="text-lg md:text-xl font-bold text-yellow-400 truncate max-w-[150px] md:max-w-[220px]">{isTeamEvent ? first.competitor?.delegation : first.competitor?.name}</h3>
                                <p className="text-yellow-200 text-xs md:text-sm truncate max-w-[150px] md:max-w-[220px]">{isTeamEvent ? first.competitor?.name : first.competitor?.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-lg shadow-[0_0_50px_rgba(234,179,8,0.4)] flex flex-col justify-end items-center h-48 md:h-64 relative">
                                <div className="absolute top-0 w-full h-1 bg-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]"></div>
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
                                <h3 className="text-base md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[180px]">{isTeamEvent ? third.competitor?.delegation : third.competitor?.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{isTeamEvent ? third.competitor?.name : third.competitor?.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-orange-800 to-orange-600 rounded-t-lg shadow-2xl flex flex-col justify-end items-center h-24 md:h-40 relative">
                                <div className="absolute top-0 w-full h-1 bg-orange-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
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
                                <h3 className="text-base md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[180px]">{isTeamEvent ? fourth.competitor?.delegation : fourth.competitor?.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-[180px]">{isTeamEvent ? fourth.competitor?.name : fourth.competitor?.delegation}</p>
                            </div>
                            <div className="w-full bg-gradient-to-t from-orange-800 to-orange-600 rounded-t-lg shadow-2xl flex flex-col justify-end items-center h-24 md:h-40 relative">
                                <div className="absolute top-0 w-full h-1 bg-orange-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                                <div className="text-4xl md:text-5xl font-black text-white/10 absolute bottom-2">3</div>
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
            `}</style>
        </div>
    );
};