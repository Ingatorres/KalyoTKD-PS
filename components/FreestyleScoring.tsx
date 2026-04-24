import React from 'react';
import { Competitor, Judge } from '../types';

interface FreestyleScoringProps {
  competitors: Competitor[];
  judges: Judge[];
  onFinalize: () => void;
}

export const FreestyleScoring: React.FC<FreestyleScoringProps> = ({ competitors, judges, onFinalize }) => {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-xl font-bold">Puntuación de Freestyle</h3>
      <p className="mt-2">Competidores: {competitors.length}</p>
      <p className="text-center mt-4">[Interfaz de puntuación para Freestyle]</p>
      <button onClick={onFinalize} className="mt-4 bg-green-500 text-white p-2 rounded">Finalizar Categoría</button>
    </div>
  );
};