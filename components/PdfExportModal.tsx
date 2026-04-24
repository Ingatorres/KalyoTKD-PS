import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PdfExportOptions } from '../types';

interface PdfExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: PdfExportOptions) => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [options, setOptions] = useState<PdfExportOptions>({
        author: '',
        organizerLogo: null,
        eventLogo: null, // Basic support if needed, but UI mainly for Organizer
        includeJudges: true,
        includeSummary: true,
        includeMatchDetails: true,
    });
    const [previews, setPreviews] = useState<{ organizer: string | null; event: string | null }>({
        organizer: null,
        event: null
    });

    if (!isOpen) return null;

    const handleLogoChange = (type: 'organizerLogo' | 'eventLogo', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setOptions(prev => ({ ...prev, [type]: file }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ 
                    ...prev, 
                    [type === 'organizerLogo' ? 'organizer' : 'event']: reader.result as string 
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirm = () => {
        onConfirm(options);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all scale-100">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Configurar Informe PDF</h3>
                    <p className="text-blue-100 text-sm mt-1">Personaliza la marca y el contenido de tu reporte</p>
                </div>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Responsable Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Responsable del Informe</label>
                        <input
                            type="text"
                            value={options.author}
                            onChange={(e) => setOptions({...options, author: e.target.value})}
                            placeholder="Nombre del responsable (Opcional)"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Event Logo Section */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logo del Evento</label>
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-300">
                                    {!previews.event ? (
                                        <div className="flex flex-col items-center space-y-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Subir Logo Evento</span>
                                        </div>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center p-2">
                                            <img src={previews.event} alt="Event Preview" className="max-h-full max-w-full object-contain drop-shadow-md" />
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleLogoChange('eventLogo', e)} />
                                </label>
                                {previews.event && (
                                    <button 
                                        onClick={(e) => { e.preventDefault(); setOptions({...options, eventLogo: null}); setPreviews(prev => ({...prev, event: null})); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                    >
                                        <span className="text-[10px] font-black">×</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Organizer Logo Section */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logo Organizador</label>
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-300">
                                    {!previews.organizer ? (
                                        <div className="flex flex-col items-center space-y-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Subir Logo Org.</span>
                                        </div>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center p-2">
                                            <img src={previews.organizer} alt="Organizer Preview" className="max-h-full max-w-full object-contain drop-shadow-md" />
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleLogoChange('organizerLogo', e)} />
                                </label>
                                {previews.organizer && (
                                    <button 
                                        onClick={(e) => { e.preventDefault(); setOptions({...options, organizerLogo: null}); setPreviews(prev => ({...prev, organizer: null})); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                    >
                                        <span className="text-[10px] font-black">×</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Toggles Section */}
                    <div className="space-y-3 pt-2">
                         <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Contenido a Incluir</label>
                        
                        <label className="flex items-center space-x-3 cursor-pointer group bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeJudges} 
                                onChange={(e) => setOptions({...options, includeJudges: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700" 
                            />
                            <span className="text-slate-700 dark:text-slate-200 font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Lista de Jueces</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer group bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeSummary} 
                                onChange={(e) => setOptions({...options, includeSummary: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700" 
                            />
                            <span className="text-slate-700 dark:text-slate-200 font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Resumen del Evento (Estadísticas)</span>
                        </label>

                         <label className="flex items-center space-x-3 cursor-pointer group bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                            <input 
                                type="checkbox" 
                                checked={options.includeMatchDetails} 
                                onChange={(e) => setOptions({...options, includeMatchDetails: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700" 
                            />
                            <span className="text-slate-700 dark:text-slate-200 font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Desglose Detallado de Puntuaciones</span>
                        </label>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-200 dark:border-white/5">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95 text-sm"
                    >
                        Generar Informe
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
