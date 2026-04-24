import React from 'react';

interface RoundsFinalistsProps {
  categoryTitle: string;
  finalists: { name: string; delegation: string; finalScore: number }[];
  poomsaeInfo: string;
}

export const RoundsFinalists: React.FC<RoundsFinalistsProps> = ({ categoryTitle, finalists, poomsaeInfo }) => {
  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold mb-6">{categoryTitle}</h1>
      <h2 className="text-4xl font-semibold mb-4">Finalistas</h2>
      <p className="text-2xl text-gray-300 mb-8">{poomsaeInfo}</p>
      <ul className="space-y-4 text-center">
        {finalists.map((finalist, index) => (
          <li key={index} className="text-3xl">
            {index + 1}. {finalist.name} ({finalist.delegation}) - <span className="font-bold text-yellow-400">{finalist.finalScore.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};