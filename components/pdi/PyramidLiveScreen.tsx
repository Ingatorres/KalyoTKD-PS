import React from 'react';
import { Score } from '../../types';



interface PyramidLiveScreenProps {
    categoryTitle: string;
    phase: string;
    matchNumber: number;
    poomsaeInfo: string;
    competitorBlue: { 
        name: string; 
        delegation: string; 
        score: number; 
        p1Score: number; 
        p2Score: number; 
        techAvg: number; 
        presAvg: number; 
        rawScores: Score; 
        poomsaeNameToPerform: string; 
    };
    competitorRed: { 
        name: string; 
        delegation: string; 
        score: number; 
        p1Score: number; 
        p2Score: number; 
        techAvg: number; 
        presAvg: number; 
        rawScores: Score; 
        poomsaeNameToPerform: string; 
    };
    modality?: string;
}

export const PyramidLiveScreen: React.FC<PyramidLiveScreenProps> = ({
    categoryTitle, phase, matchNumber, poomsaeInfo, competitorBlue, competitorRed, modality
}) => {
    const isTeamEvent = modality?.toLowerCase().includes('pareja') || modality?.toLowerCase().includes('equipo') || modality?.toLowerCase().includes('trio');
    if (!competitorBlue || !competitorRed) {
        return (
            <div className="h-screen w-screen flex flex-col justify-center items-center text-white font-sans bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="animate-pulse">
                    <h1 className="text-5xl font-bold">Esperando datos de la competencia...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col text-white font-sans overflow-hidden">
            {/* Header Section - Dark background */}
            <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-center py-6 px-4 shadow-2xl animate-fadeIn">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-wide">{categoryTitle}</h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-2">
                    Fase: <span className="font-semibold">{phase}</span> - Encuentro <span className="font-semibold">#{matchNumber}</span>
                </p>
                <p className="text-2xl md:text-3xl text-yellow-400 font-bold mt-2 animate-pulse">
                    {poomsaeInfo}
                </p>
            </header>

            {/* Main Content - Split Screen */}
            <div className="flex flex-grow">
                {/* LEFT SIDE - RED COMPETITOR (HONG) */}
                <div className="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col justify-between p-6 animate-slideInLeft">
                    {/* Competitor Info */}
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-wide mb-3 drop-shadow-lg">
                            HONG
                        </h2>
                        <p className="text-2xl md:text-3xl font-semibold drop-shadow-md">
                            {isTeamEvent ? competitorRed.delegation : competitorRed.name}
                        </p>
                        <p className="text-lg md:text-xl text-red-200 mt-1">
                            {isTeamEvent ? competitorRed.name : competitorRed.delegation}
                        </p>
                    </div>

                    {/* Scores Section */}
                    <div className="flex-grow flex flex-col justify-center">
                        {/* Technical and Presentation Averages */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                                <p className="text-xl font-semibold mb-2">TÉCNICA</p>
                                <p className="text-5xl font-bold mb-1">{(competitorRed.techAvg || 0).toFixed(2)}</p>

                            </div>
                            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                                <p className="text-xl font-semibold mb-2">PRESENTACIÓN</p>
                                <p className="text-5xl font-bold mb-1">{(competitorRed.presAvg || 0).toFixed(2)}</p>

                            </div>
                        </div>

                        {/* P1 and P2 Scores if applicable */}
                        {competitorRed.p2Score > 0 && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white bg-opacity-15 rounded-lg p-3 text-center">
                                    <p className="text-lg font-semibold">Puntaje P1</p>
                                    <p className="text-3xl font-bold">{(competitorRed.p1Score || 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-white bg-opacity-15 rounded-lg p-3 text-center">
                                    <p className="text-lg font-semibold">Puntaje P2</p>
                                    <p className="text-3xl font-bold">{(competitorRed.p2Score || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Final Score */}
                    <div className="bg-white bg-opacity-20 rounded-2xl p-6 text-center backdrop-blur-md shadow-2xl border-4 border-white border-opacity-30">
                        <p className="text-2xl font-bold mb-2">
                            {competitorRed.p2Score > 0 ? 'PROMEDIO FINAL' : 'PUNTAJE FINAL'}
                        </p>
                        <p className="text-8xl md:text-9xl font-black tracking-tighter animate-scaleIn">
                            {(competitorRed.score || 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE - BLUE COMPETITOR (CHONG) */}
                <div className="w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col justify-between p-6 animate-slideInRight">
                    {/* Competitor Info */}
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-wide mb-3 drop-shadow-lg">
                            CHONG
                        </h2>
                        <p className="text-2xl md:text-3xl font-semibold drop-shadow-md">
                            {isTeamEvent ? competitorBlue.delegation : competitorBlue.name}
                        </p>
                        <p className="text-lg md:text-xl text-blue-200 mt-1">
                            {isTeamEvent ? competitorBlue.name : competitorBlue.delegation}
                        </p>
                    </div>

                    {/* Scores Section */}
                    <div className="flex-grow flex flex-col justify-center">
                        {/* Technical and Presentation Averages */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                                <p className="text-xl font-semibold mb-2">TÉCNICA</p>
                                <p className="text-5xl font-bold mb-1">{(competitorBlue.techAvg || 0).toFixed(2)}</p>

                            </div>
                            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                                <p className="text-xl font-semibold mb-2">PRESENTACIÓN</p>
                                <p className="text-5xl font-bold mb-1">{(competitorBlue.presAvg || 0).toFixed(2)}</p>

                            </div>
                        </div>

                        {/* P1 and P2 Scores if applicable */}
                        {competitorBlue.p2Score > 0 && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white bg-opacity-15 rounded-lg p-3 text-center">
                                    <p className="text-lg font-semibold">Puntaje P1</p>
                                    <p className="text-3xl font-bold">{(competitorBlue.p1Score || 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-white bg-opacity-15 rounded-lg p-3 text-center">
                                    <p className="text-lg font-semibold">Puntaje P2</p>
                                    <p className="text-3xl font-bold">{(competitorBlue.p2Score || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Final Score */}
                    <div className="bg-white bg-opacity-20 rounded-2xl p-6 text-center backdrop-blur-md shadow-2xl border-4 border-white border-opacity-30">
                        <p className="text-2xl font-bold mb-2">
                            {competitorBlue.p2Score > 0 ? 'PROMEDIO FINAL' : 'PUNTAJE FINAL'}
                        </p>
                        <p className="text-8xl md:text-9xl font-black tracking-tighter animate-scaleIn">
                            {(competitorBlue.score || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0.5; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.8s ease-out;
                }
                .animate-slideInRight {
                    animation: slideInRight 0.8s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};