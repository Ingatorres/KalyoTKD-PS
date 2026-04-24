/**
 * components/PyramidExportModal.tsx
 * 
 * Modal for selecting and exporting pyramid categories
 * Material Design 3 - Kalyo Connect Theme
 */

import React, { useState } from 'react';
import { savePyramidExport, exportPyramidsToJson } from '../pyramidExporter';
import { Event, Category } from '../types';

interface PyramidExportModalProps {
  isOpen: boolean;
  event: Event;
  onClose: () => void;
  onExportSuccess?: () => void;
}

export const PyramidExportModal: React.FC<PyramidExportModalProps> = ({
  isOpen,
  event,
  onClose,
  onExportSuccess
}) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const pyramidCategories =
    event.categories?.filter(cat => cat.system === 'Pirámide') || [];

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleExport = async () => {
    if (selectedCategories.size === 0) {
      setExportStatus('Selecciona al menos una categoría');
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('Generando exportación...');

      const exportData = await exportPyramidsToJson(
        event,
        Array.from(selectedCategories)
      );

      await savePyramidExport(exportData);

      setExportStatus('✓ ¡Exportación completada correctamente!');
      
      setTimeout(() => {
        onExportSuccess?.();
        onClose();
      }, 1500);
    } catch (error: any) {
      setExportStatus(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-xl w-full border border-outline-variant/30">
        {/* Header */}
        <div className="bg-gradient-to-br from-tertiary to-tertiary/90 text-white p-8 flex justify-between items-center rounded-t-3xl">
          <div>
            <h2 className="text-3xl font-black">Exportar Pirámides</h2>
            <p className="text-sm text-white/80 mt-1">Copia datos para usar en otro dispositivo</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {pyramidCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-on-surface-variant text-sm">
                No hay categorías de pirámide para exportar
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Selecciona las categorías de pirámide que deseas exportar:
              </p>

              {/* Category List */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 max-h-64 overflow-y-auto">
                {pyramidCategories.map((cat, idx) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-4 p-4 hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="w-6 h-6 rounded border-2 border-outline accent-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-black text-on-surface text-sm">{cat.title}</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        ⚡ {cat.competitors.length} competidores
                        {cat.pyramidMatches?.length && (
                          <> • ⚔️ {cat.pyramidMatches.length} combates</>
                        )}
                      </p>
                    </div>
                    <div className={`
                      w-5 h-5 rounded-full transition-colors
                      ${selectedCategories.has(cat.id) ? 'bg-primary' : 'border-2 border-outline-variant'}
                    `}></div>
                  </label>
                ))}
              </div>

              {/* Selection Summary */}
              {selectedCategories.size > 0 && (
                <div className="bg-primary/10 border-l-4 border-primary rounded-xl p-4">
                  <p className="text-primary font-black text-sm">
                    ✓ {selectedCategories.size} categoría{selectedCategories.size !== 1 ? 's' : ''} seleccionada{selectedCategories.size !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Status Message */}
              {exportStatus && (
                <div
                  className={`p-4 rounded-xl text-sm font-bold ${
                    exportStatus.startsWith('✓')
                      ? 'bg-sky-blue/15 text-sky-blue'
                      : exportStatus.startsWith('Error')
                      ? 'bg-error-container/30 text-error'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {exportStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface-container border-t border-outline-variant/30 p-6 flex gap-3 justify-end rounded-b-3xl">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-3 bg-outline-variant/20 hover:bg-outline-variant/30 disabled:opacity-50 text-on-surface rounded-2xl font-black transition-colors uppercase text-xs tracking-wider"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedCategories.size === 0}
            className="px-6 py-3 bg-tertiary hover:bg-tertiary/90 disabled:bg-outline-variant/50 disabled:cursor-not-allowed text-white rounded-2xl font-black transition-colors uppercase text-xs tracking-wider"
          >
            {isExporting ? '⏳ Exportando...' : '⬇️ Exportar JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};
