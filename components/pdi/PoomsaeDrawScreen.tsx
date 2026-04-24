import React from 'react';
import { PdiPoomsaeDrawData } from '../../types';

export const PoomsaeDrawScreen: React.FC<PdiPoomsaeDrawData> = ({ categoryTitle, poomsaes }) => {
  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">{categoryTitle}</h1>
        <h2 className="text-4xl font-semibold">Poomsae Sorteado(s):</h2>
        <div className="mt-8 text-5xl font-bold text-yellow-400">
          {poomsaes.filter(p => p).join(' y ')}
        </div>
      </div>
    </div>
  );
};