import React, { useState, useEffect } from 'react';
import { PdiCompetitionStartData, CompetitionSystem } from '../../types';

export const CompetitionStartScreen: React.FC<PdiCompetitionStartData> = ({ categoryTitle, poomsaes, system }) => {
  const [step, setStep] = useState<'category' | 'poomsae'>('category');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('poomsae');
    }, 3000); // Show category title for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const poomsaeText = poomsaes.filter(p => p).join(' y ');
  const isFreestyle = system === CompetitionSystem.Freestyle;
  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center p-8 transition-opacity duration-1000">
      {step === 'category' && (
        <div className="text-center animate-fade-in">
          <h1 className="text-7xl font-bold">{categoryTitle}</h1>
        </div>
      )}
      {step === 'poomsae' && (
        <div className="text-center animate-fade-in">
          <h2 className="text-5xl font-semibold mb-6">
            {isFreestyle ? "Presentación" : "Poomsae(s) a ejecutar:"}
          </h2>
          <div className="font-bold text-yellow-400 text-7xl md:text-8xl lg:text-9xl" style={{ lineHeight: '1.1' }}>
            {isFreestyle 
              ? "Freestyle" 
              : (poomsaeText || "No definido")}
          </div>
        </div>
      )}
    </div>
  );
};