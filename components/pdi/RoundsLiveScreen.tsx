import React from 'react';
import { PdiRoundsLiveData } from '../../types';

export const RoundsLiveScreen: React.FC<PdiRoundsLiveData> = ({
  categoryTitle,
  currentCompetitor,
  poomsaeInfo,
  poomsaeCount,
  liveScores,
  allScores,
}) => {
  if (!currentCompetitor) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <h1 className="text-4xl font-bold">Esperando datos del competidor...</h1>
      </div>
    );
  }

  const isTwoPoomsaes = poomsaeCount === 2;

  // Corrected final average calculation
  const p1 = liveScores.p1Score || 0;
  const p2 = liveScores.p2Score || 0;
  const numPoomsaesScored = (p1 > 0 ? 1 : 0) + (p2 > 0 ? 1 : 0);
  const finalAverage = isTwoPoomsaes 
    ? (numPoomsaesScored > 0 ? (p1 + p2) / numPoomsaesScored : 0)
    : liveScores.finalScore;

  const roundTitle = (allScores || []).length > 8 ? 'RONDA CLASIFICATORIA' : 'RONDA FINAL';

  return (
    <div className="w-screen h-screen flex flex-col bg-white text-gray-800 font-sans overflow-hidden p-2">
      {/* Header Section - Compact */}
      <header className="flex-none text-center mb-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-blue-600 truncate px-2">
          {categoryTitle}
        </h1>
        <p className="text-xl md:text-2xl font-bold text-red-600 uppercase">
          {roundTitle}
        </p>
      </header>

      {/* Main Content - Flex Grow */}
      <main className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
        
        {/* Competitor Info - Compact */}
        <div className="flex-none py-2 px-4 text-center border-b border-gray-200 bg-gray-50">
          <p className="text-lg text-gray-500 uppercase tracking-wide font-semibold mb-0">Puntuando a:</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-blue-700 my-1 truncate leading-tight">
            {currentCompetitor?.name}
          </h2>
          <p className="text-xl md:text-2xl font-bold text-gray-600">
            {currentCompetitor?.delegation}
          </p>
        </div>

        {/* Poomsae Info - Compact */}
        <div className="flex-none py-2 bg-blue-50 border-b border-blue-100">
             <p className="text-2xl font-bold text-blue-800 text-center uppercase tracking-wider">
                {poomsaeInfo}
             </p>
        </div>

        {/* Scores Section - Flex Grow to fill remaining space */}
        <div className="flex-1 flex flex-col justify-center p-2 md:p-4 min-h-0">
          {isTwoPoomsaes ? (
            <div className="w-full h-full flex flex-col">
              {/* Table Container */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <table className="w-full text-center table-fixed h-full">
                  <thead>
                    <tr className="text-gray-500 font-bold text-xl border-b-2 border-gray-200 h-10">
                      <th className="w-[20%]"></th>
                      <th className="w-[26%] text-blue-600 uppercase">Técnica</th>
                      <th className="w-[26%] text-red-600 uppercase">Presentación</th>
                      <th className="w-[28%] text-gray-800 uppercase">Parcial</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    <tr className="border-b border-gray-100 h-1/2">
                      <td className="text-left text-gray-600 text-2xl font-bold pl-4">Poomsae 1</td>
                      <td className="text-5xl md:text-6xl font-black">{(liveScores.p1TechAvg || 0).toFixed(2)}</td>
                      <td className="text-5xl md:text-6xl font-black">{(liveScores.p1PresAvg || 0).toFixed(2)}</td>
                      <td className="text-5xl md:text-6xl font-black text-gray-900">{((liveScores.p1TechAvg || 0) + (liveScores.p1PresAvg || 0)).toFixed(2)}</td>
                    </tr>
                    <tr className="h-1/2">
                      <td className="text-left text-gray-600 text-2xl font-bold pl-4">Poomsae 2</td>
                      <td className="text-5xl md:text-6xl font-black">{(liveScores.p2TechAvg || 0).toFixed(2)}</td>
                      <td className="text-5xl md:text-6xl font-black">{(liveScores.p2PresAvg || 0).toFixed(2)}</td>
                      <td className="text-5xl md:text-6xl font-black text-gray-900">{((liveScores.p2TechAvg || 0) + (liveScores.p2PresAvg || 0)).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Average Footer */}
              <div className="flex-none mt-2 pt-2 border-t-4 border-gray-300 bg-gray-50 rounded-xl p-2 flex justify-between items-center px-8">
                <p className="text-3xl font-bold text-blue-700 uppercase">Promedio Final</p>
                <p className="text-6xl md:text-7xl font-black text-gray-900 tracking-tighter">
                    {(finalAverage || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center min-h-0">
               <div className="flex-1 grid grid-cols-2 gap-4 items-center min-h-0">
                  <div className="flex flex-col items-center justify-center h-full bg-blue-50 rounded-2xl border-2 border-blue-100 p-2">
                    <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 uppercase">Técnica</p>
                    <p className="text-7xl md:text-8xl lg:text-9xl font-black text-gray-900 tracking-tighter">
                        {(liveScores.technicalAvg || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-2xl border-2 border-red-100 p-2">
                    <p className="text-2xl md:text-3xl font-bold text-red-600 mb-1 uppercase">Presentación</p>
                    <p className="text-7xl md:text-8xl lg:text-9xl font-black text-gray-900 tracking-tighter">
                        {(liveScores.presentationAvg || 0).toFixed(2)}
                    </p>
                  </div>
              </div>
              
              <div className="flex-none mt-4 pt-2 border-t-4 border-gray-300 text-center">
                  <p className="text-3xl font-bold text-blue-600 uppercase mb-0">Puntaje Final</p>
                  <p className="text-8xl md:text-9xl lg:text-[10rem] leading-none font-black text-gray-900 tracking-tighter">
                    {(liveScores.finalScore || 0).toFixed(2)}
                  </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};