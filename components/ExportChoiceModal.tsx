import React from 'react';
import ReactDOM from 'react-dom';

interface ExportChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPdf: () => void;
    onSelectExcel: () => void;
    onSelectJson: () => void;
    onSelectFinalResults: () => void;
}

export const ExportChoiceModal: React.FC<ExportChoiceModalProps> = ({ isOpen, onClose, onSelectPdf, onSelectExcel, onSelectJson, onSelectFinalResults }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Exportar Datos</h3>
                    <p className="text-blue-100 text-xs mt-2 font-medium">Selecciona el formato de exportación deseado</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 gap-3">
                    {/* JSON Option */}
                    <button 
                        onClick={() => { onSelectJson(); onClose(); }}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/20 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Backup / Transferencia</p>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">JSON (Cargar en otra PC)</p>
                        </div>
                    </button>

                    {/* Excel Option */}
                    <button 
                        onClick={() => { onSelectExcel(); onClose(); }}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 hover:border-green-500 hover:bg-green-500/20 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Análisis de Datos</p>
                            <p className="text-xs font-bold text-green-700 dark:text-green-400">XLSM (Ver Resultados)</p>
                        </div>
                    </button>

                    {/* PDF Option */}
                    <button 
                        onClick={() => { onSelectPdf(); onClose(); }}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/20 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15.5l3 3 3-3"/></svg>
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Documento Oficial</p>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400">PDF (Ver Pirámides)</p>
                        </div>
                    </button>

                    {/* Final Results PDF Option */}
                    <button 
                        onClick={() => { 
                            console.log("Botón Premiación clickeado");
                            if (typeof onSelectFinalResults === 'function') {
                                onSelectFinalResults(); 
                            } else {
                                alert("Error: La función de exportación no está vinculada al modal.");
                            }
                            onClose(); 
                        }}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500 hover:bg-purple-500/20 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Premiación</p>
                            <p className="text-xs font-bold text-purple-700 dark:text-purple-400">PDF (Resultados 1º-4º puesto)</p>
                        </div>
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
