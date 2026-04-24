
import React, { useState, useEffect } from 'react';
import { Event, Screen, Category } from '../types';
import { Header } from './Header';
import { exportEventToPdf } from '../pdfExporter';
import { exportEventToExcel } from '../excelExporter';
import { exportEventToJson } from '../jsonExporter';
import { PdfExportModal } from './PdfExportModal';
import { ExportChoiceModal } from './ExportChoiceModal';
import { PdfExportOptions } from '../types';

// Sub-component for displaying the details of a completed event
const CompletedEventDetails: React.FC<{ event: Event; onBack: () => void; onViewCategoryResults: (categoryId: string) => void; }> = ({ event, onBack, onViewCategoryResults }) => {
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>(event.categories.map(c => c.id));

    const toggleSelectAll = () => {
        if (selectedIds.length === event.categories.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(event.categories.map(c => c.id));
        }
    };

    const toggleId = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 drop-shadow-sm">{event.name}</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-light">Resumen del Evento Finalizado</p>
                </div>
                <div className="flex space-x-4">
                    <button 
                        onClick={() => setIsChoiceModalOpen(true)} 
                        disabled={selectedIds.length === 0}
                        className={`font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 group border ${
                            selectedIds.length > 0 
                            ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30' 
                            : 'bg-slate-700/20 text-slate-500 border-slate-700/30 cursor-not-allowed opacity-50'
                        }`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exportar Selección ({selectedIds.length})
                    </button>
                    
                    <ExportChoiceModal 
                        isOpen={isChoiceModalOpen}
                        onClose={() => setIsChoiceModalOpen(false)}
                        onSelectPdf={() => setIsPdfModalOpen(true)}
                        onSelectExcel={() => exportEventToExcel({ ...event, categories: event.categories.filter(c => selectedIds.includes(c.id)) })}
                        onSelectJson={() => exportEventToJson({ ...event, categories: event.categories.filter(c => selectedIds.includes(c.id)) })}
                    />

                    <PdfExportModal 
                        isOpen={isPdfModalOpen} 
                        onClose={() => setIsPdfModalOpen(false)} 
                        onConfirm={(options) => exportEventToPdf(event, { ...options, selectedCategoryIds: selectedIds })} 
                    />
                    <button onClick={onBack} className="bg-slate-700 text-slate-300 py-2 px-6 rounded-lg hover:bg-slate-600 text-sm font-bold transition-all border border-white/5">
                        &larr; Volver a la Lista
                    </button>
                </div>
            </div>

            {/* Event Details Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-white/5 mb-8 shadow-inner relative z-10">
                <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Jefe de Área</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{event.areaChief}</p>
                </div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Número de Área</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{event.areaNumber}</p>
                </div>
            </div>

            {/* Categories Table */}
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Categorías del Evento</h3>
                <button 
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                >
                    {selectedIds.length === event.categories.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-inner relative z-10">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                    <thead className="bg-slate-100 dark:bg-slate-900/80">
                        <tr>
                            <th className="px-4 py-4 w-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.length === event.categories.length} 
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sistema</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-white/5">
                        {event.categories.map(category => (
                            <tr key={category.id} className={`hover:bg-white/5 transition-colors ${selectedIds.includes(category.id) ? 'bg-blue-900/5' : ''}`}>
                                <td className="px-4 py-4 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(category.id)} 
                                        onChange={() => toggleId(category.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{category.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{category.system}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => onViewCategoryResults(category.id)} className="text-blue-400 hover:text-blue-300 font-bold hover:underline">Ver Resultados</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ExistingEventsScreenProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
  setScreen: (screen: Screen) => void;
  viewingEventId: string | null;
  setViewingEventId: (id: string | null) => void;
  setCurrentEventId: (id: string | null) => void;
  setCurrentCategoryId: (id: string) => void;
}

export const ExistingEventsScreen: React.FC<ExistingEventsScreenProps> = ({ events, onSelectEvent, setScreen, viewingEventId, setViewingEventId, setCurrentEventId, setCurrentCategoryId }) => {
  const [selectedCompletedEvent, setSelectedCompletedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (viewingEventId) {
        const eventToView = events.find(e => e.id === viewingEventId);
        if (eventToView) {
            setSelectedCompletedEvent(eventToView);
        }
        setViewingEventId(null); // Reset the trigger
    }
  }, [viewingEventId, events, setViewingEventId]);

  const handleEventClick = (event: Event) => {
    if (event.status === 'completed') {
      setSelectedCompletedEvent(event);
    } else {
      onSelectEvent(event.id);
    }
  };

  const handleViewCategoryResults = (categoryId: string) => {
    if (selectedCompletedEvent) {
        setCurrentEventId(selectedCompletedEvent.id);
        setCurrentCategoryId(categoryId);
        setScreen('RESULTS_VIEWER');
    }
  };

    if (selectedCompletedEvent) {
    return (
        <div className="min-h-screen transition-colors duration-300">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-10 pointer-events-none mix-blend-overlay"></div>
            <Header />
            <main className="max-w-6xl mx-auto py-8 px-6 relative z-10">
                <CompletedEventDetails event={selectedCompletedEvent} onBack={() => setSelectedCompletedEvent(null)} onViewCategoryResults={handleViewCategoryResults} />
            </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-10 pointer-events-none mix-blend-overlay"></div>
      <Header />
      <main className="max-w-6xl mx-auto py-8 px-6 relative z-10">
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 drop-shadow-sm">Eventos en Proceso o Finalizados</h2>
            <button onClick={() => setScreen('HOME')} className="text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-2">
                &larr; Volver al Inicio
            </button>
        </div>
        
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 relative overflow-hidden min-h-[60vh]">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                    <thead className="bg-slate-100 dark:bg-slate-900/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre del Evento</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-white/5">
                        {events.map(event => (
                            <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{event.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{event.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                                        event.status === 'active' 
                                        ? 'bg-blue-900/50 text-blue-400 border-blue-500/30' 
                                        : 'bg-green-900/50 text-green-400 border-green-500/30'
                                    }`}>
                                        {event.status === 'active' ? 'En Proceso' : 'Finalizado'}
                                    </span>
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleEventClick(event)} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        {event.status === 'active' ? 'Acceder' : 'Ver Resumen'}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {events.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-500 italic">No se han encontrado eventos previos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
};
