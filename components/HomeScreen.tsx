
import React from 'react';
import { Screen } from '../types';
import { Header } from './Header';

interface HomeScreenProps {
  setScreen: (screen: Screen) => void;
  hasEvents: boolean;
  isActivated: boolean;
  onImportPyramids?: () => void;
}

// A simple card component for actions
const ActionCard: React.FC<{
  title: string;
  description: string;
  borderColor: 'blue' | 'red';
  onClick: () => void;
  disabled?: boolean;
}> = ({ title, description, borderColor, onClick, disabled = false }) => {
  const gradientClass = borderColor === 'blue' 
    ? 'dark:from-blue-600/20 dark:to-blue-900/40 border-l-4 border-blue-500 bg-white dark:bg-transparent' 
    : 'dark:from-red-600/20 dark:to-red-900/40 border-l-4 border-red-500 bg-white dark:bg-transparent';
  
  const hoverClass = disabled ? '' : 'hover:scale-[1.02] hover:shadow-2xl';
  const cursorClass = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
  const titleColor = borderColor === 'blue' ? 'text-blue-600 dark:text-blue-300' : 'text-red-600 dark:text-red-300';
  const descColor = 'text-slate-600 dark:text-gray-300';

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`bg-gradient-to-br ${gradientClass} backdrop-blur-md rounded-xl shadow-lg dark:shadow-xl overflow-hidden transform transition-all duration-300 border border-slate-200 dark:border-white/10 ${hoverClass} ${cursorClass}`}
    >
      <div className="p-6 h-full flex flex-col">
        <h2 className={`text-2xl font-bold mb-3 ${titleColor} drop-shadow-sm`}>{title}</h2>
        <p className={`${descColor} leading-relaxed text-sm flex-grow`}>{description}</p>
        
        {!disabled && (
            <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-slate-500 dark:text-white/60 text-xs uppercase tracking-widest font-semibold flex items-center gap-1">
                    Acceder <span>&rarr;</span>
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ setScreen, hasEvents, isActivated, onImportPyramids }) => {

  const handleCreateEventClick = () => {
    if (isActivated) {
      setScreen('NEW_EVENT');
    } else {
      alert('La licencia del software ha expirado. Por favor, reactive para crear nuevos eventos.');
      setScreen('ACTIVATION');
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <Header />
      
      <main className="relative max-w-5xl mx-auto py-12 px-6 z-10 flex flex-col justify-center min-h-[80vh]">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 dark:from-blue-400 dark:via-white dark:to-red-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                PANEL DE CONTROL
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-light tracking-wide">
                Gestión profesional de Poomsaes y Competencias
            </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 px-4 group">
          <ActionCard
            title="Crear Nuevo Evento"
            description="Inicie una nueva competencia desde cero. Configure responsables, áreas, jueces y categorías con precisión."
            borderColor="blue"
            onClick={handleCreateEventClick}
          />
          <ActionCard
            title="Eventos en Proceso o Finalizados"
            description="Acceda al historial de competencias. Retome eventos activos o consulte resultados y estadísticas detalladas."
            borderColor="red"
            onClick={() => setScreen('EXISTING_EVENTS')}
            disabled={!hasEvents}
          />
        </div>

        {/* Import Pyramids Option */}
        <div className="mt-12 text-center">
          <button
            onClick={onImportPyramids}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-tertiary to-tertiary/90 hover:from-tertiary/90 hover:to-tertiary/80 text-white rounded-2xl font-black uppercase text-sm tracking-wider transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl border border-tertiary/20"
          >
            <span className="text-xl">⬆️</span>
            <span>Importar Pirámides Previas</span>
          </button>
          <p className="text-xs text-on-surface-variant mt-4 font-light">
            Carga estructuras de pirámides exportadas desde otro computador
          </p>
        </div>
        
        <div className="mt-16 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-600 font-mono">v2.1.0 • Kalyo Technology Integration</p>
        </div>
      </main>
    </div>
  );
};
