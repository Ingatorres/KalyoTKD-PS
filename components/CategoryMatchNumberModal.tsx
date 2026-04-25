import React, { useState } from 'react';
import { Category, Event, PyramidMatch } from '../types';

interface CategoryMatchNumberModalProps {
    category: Category;
    event: Event;
    updateEvent: (event: Event) => void;
    onClose: () => void;
}

export const CategoryMatchNumberModal: React.FC<CategoryMatchNumberModalProps> = ({ category, event, updateEvent, onClose }) => {
    // Local state for edits before saving
    const [matches, setMatches] = useState<PyramidMatch[]>(
        JSON.parse(JSON.stringify(category.pyramidMatches?.filter(m => !m.byeWinner) || []))
    );

    const handleNumberChange = (matchId: string, value: string) => {
        setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
                return { ...m, matchNumber: value === '' ? undefined : parseInt(value, 10) };
            }
            return m;
        }));
    };

    const handleSave = () => {
        const newEvent = JSON.parse(JSON.stringify(event)) as Event;
        const targetCat = newEvent.categories.find(c => c.id === category.id);
        if (targetCat && targetCat.pyramidMatches) {
            targetCat.pyramidMatches = targetCat.pyramidMatches.map(m => {
                const updated = matches.find(um => um.id === m.id);
                if (updated) {
                    return { ...m, matchNumber: updated.matchNumber };
                }
                return m;
            });
            updateEvent(newEvent);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Numeración Manual</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.title}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {matches.length === 0 ? (
                        <p className="text-gray-500 text-center">No hay combates activos en esta categoría.</p>
                    ) : (
                        matches.map((match, idx) => (
                            <div key={match.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{match.phase}</span>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {match.competitorBlue?.name || 'Por definir'} <span className="text-gray-400 mx-2">vs</span> {match.competitorRed?.name || 'Por definir'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-gray-500">Match #</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={match.matchNumber || ''} 
                                        onChange={(e) => handleNumberChange(match.id, e.target.value)}
                                        className="w-20 p-2 text-center rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-gray-800 dark:text-white font-bold focus:ring-2 focus:ring-blue-500"
                                        placeholder="-"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800 rounded-b-2xl">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition"
                    >
                        Guardar Números
                    </button>
                </div>
            </div>
        </div>
    );
};
