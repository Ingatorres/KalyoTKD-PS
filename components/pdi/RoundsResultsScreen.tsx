import React from 'react';
import { Competitor } from '../../types';

interface DisplayScore {
  id: string;
  name: string;
  delegation: string;
  techAvg: number;
  presAvg: number;
  finalScore: number;
}

interface RoundsResultsScreenProps {
  categoryTitle: string;
  displayScores: DisplayScore[];
  competitors: Competitor[];
}

export const RoundsResultsScreen: React.FC<RoundsResultsScreenProps> = ({
  categoryTitle,
  displayScores,
  competitors,
}) => {
  const isClassification = competitors.length > 8;
  const title = isClassification ? "Resultados Clasificatorios (Top 8)" : "Resultados Finales (Top 4)";
  
  // displayScores is pre-sorted by the parent. We just slice the top N.
  const displayResults = (isClassification ? displayScores.slice(0, 8) : displayScores.slice(0, 4)).map(s => ({
      name: s.name,
      delegation: s.delegation,
      techAvg: s.techAvg,
      presAvg: s.presAvg,
      score: s.finalScore
  }));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-8">
      <h1 className="text-5xl font-bold mb-4">{categoryTitle}</h1>
      <h2 className="text-3xl font-semibold text-gray-300 mb-8">{title}</h2>
      
      <div className="w-full max-w-4xl bg-white text-gray-800 rounded-lg shadow-2xl overflow-hidden">
        <table className="min-w-full text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-4 px-6 text-2xl font-bold uppercase">Puesto</th>
              <th className="py-4 px-6 text-2xl font-bold uppercase">Nombre</th>
              <th className="py-4 px-6 text-2xl font-bold uppercase">Delegación</th>
              <th className="py-4 px-6 text-2xl font-bold uppercase">Tec.</th>
              <th className="py-4 px-6 text-2xl font-bold uppercase">Pres.</th>
              <th className="py-4 px-6 text-2xl font-bold uppercase">P. Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayResults.map((res, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-4 px-6 text-4xl font-extrabold">{isClassification ? '-' : idx + 1}</td>
                <td className="py-4 px-6 text-3xl font-semibold">{res.name}</td>
                <td className="py-4 px-6 text-2xl">{res.delegation}</td>
                <td className="py-4 px-6 text-2xl">{res.techAvg.toFixed(2)}</td>
                <td className="py-4 px-6 text-2xl">{res.presAvg.toFixed(2)}</td>
                <td className="py-4 px-6 text-4xl font-bold text-blue-600">{res.score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};