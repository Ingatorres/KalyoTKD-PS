import React from 'react';
import { PdiFreestylePresentationData } from '../../types';

interface FreestylePresentationScreenProps {
  data: PdiFreestylePresentationData;
}

export const FreestylePresentationScreen: React.FC<FreestylePresentationScreenProps> = ({ data }) => {
  const { categoryTitle, competitorName, competitorDelegation } = data;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
      <h1 className="text-5xl font-bold mb-8 text-indigo-400">{categoryTitle}</h1>
      <div className="text-center">
        <p className="text-6xl font-semibold mb-4">Presentación Freestyle</p>
        <p className="text-7xl font-bold text-yellow-300">{competitorName}, {competitorDelegation}</p>
      </div>
    </div>
  );
};
