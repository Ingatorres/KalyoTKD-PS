/**
 * components/PyramidImportModal.tsx
 * 
 * Modal dialog for importing pyramid tournament structures
 * Handles file selection, validation, and merge confirmation
 */

import React, { useState } from 'react';
import {
  importPyramidsFromJson,
  validatePyramidImport,
  mergePyramidImport,
  type PyramidExportData
} from '../pyramidExporter';
import { Event } from '../types';
import * as tauriUtils from '../tauriUtils';

interface PyramidImportModalProps {
  isOpen: boolean;
  event: Event;
  onImportSuccess: (updatedEvent: Event) => void;
  onClose: () => void;
}

export const PyramidImportModal: React.FC<PyramidImportModalProps> = ({
  isOpen,
  event,
  onImportSuccess,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importData, setImportData] = useState<PyramidExportData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'file-select' | 'preview' | 'confirm'>('file-select');

  const handleFileSelect = async () => {
    try {
      setIsLoading(true);
      // Open file picker for JSON files
      const filePath = await tauriUtils.selectFile('.json');
      
      if (!filePath) return;
      
      setSelectedFile(filePath);
      
      // Load and validate JSON
      const data = await importPyramidsFromJson(filePath);
      setImportData(data);
      
      // Validate compatibility
      const errors = validatePyramidImport(data, event);
      setValidationErrors(errors);
      
      // Move to preview step
      setStep('preview');
    } catch (error: any) {
      setValidationErrors([
        `Error al cargar archivo: ${error.message || 'Archivo inválido'}`
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportConfirm = () => {
    if (!importData) return;
    
    if (validationErrors.length > 0) {
      setValidationErrors([
        'No se puede importar mientras existan errores de validación'
      ]);
      return;
    }
    
    // Merge imported data with event
    const updatedEvent = mergePyramidImport(importData, event);
    onImportSuccess(updatedEvent);
    
    // Reset and close
    setStep('file-select');
    setSelectedFile(null);
    setImportData(null);
    setValidationErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-primary to-primary/90 text-white p-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black mb-1">Importar Pirámides</h2>
            <p className="text-sm text-white/80">Carga datos de torneos desde otro dispositivo</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {/* Validation Errors - Visible in any step if they exist */}
          {validationErrors.length > 0 && (
            <div className="bg-error-container/30 border-l-4 border-error rounded-2xl p-6">
              <p className="font-black text-error text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="text-lg">⚠️</span> {step === 'file-select' ? 'Error al cargar' : 'Errores de validación'}
              </p>
              <ul className="space-y-2 text-sm text-error">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
              {step === 'file-select' && (
                <button 
                  onClick={() => setValidationErrors([])}
                  className="mt-4 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                >
                  Limpiar error y reintentar
                </button>
              )}
            </div>
          )}

          {step === 'file-select' && (
            <div className="space-y-4">
              <div className="bg-primary/5 border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center">
                <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                  Selecciona un archivo JSON que contenga las pirámides previamente exportadas
                </p>
                <button
                  onClick={handleFileSelect}
                  disabled={isLoading}
                  className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-outline-variant/50 text-white font-black rounded-2xl transition-all duration-300 uppercase tracking-wider text-sm disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Cargando...' : '📂 Seleccionar archivo JSON'}
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && importData && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 mb-6">
                <div className="bg-sky-blue/15 rounded-full p-3">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Evento importado</p>
                  <h3 className="text-2xl font-black text-primary mt-1">{importData.eventName}</h3>
                  <p className="text-xs text-on-surface-variant mt-2">
                    Exportado: {new Date(importData.exportDate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30">
                <p className="font-black text-on-surface text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">{importData.pyramidCategories.length}</span>
                  Categorías a importar
                </p>
                <ul className="space-y-2">
                  {importData.pyramidCategories.map((cat, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 hover:bg-surface-container-highest/50 rounded-lg transition-colors">
                      <span className="text-primary text-lg flex-shrink-0">⚡</span>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface text-sm">{cat.categoryTitle}</p>
                        <p className="text-xs text-on-surface-variant">{cat.competitors.length} competidores</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-container border-t border-outline-variant/30 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-outline-variant/20 hover:bg-outline-variant/30 text-on-surface rounded-2xl font-black transition-colors uppercase text-xs tracking-wider"
          >
            Cancelar
          </button>
          
          {step === 'preview' && validationErrors.length === 0 && (
            <button
              onClick={handleImportConfirm}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black transition-colors uppercase text-xs tracking-wider"
            >
              ✓ Confirmar Importación
            </button>
          )}
          
          {step === 'preview' && validationErrors.length > 0 && (
            <button
              onClick={() => setStep('file-select')}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black transition-colors uppercase text-xs tracking-wider"
            >
              ← Seleccionar otro archivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
