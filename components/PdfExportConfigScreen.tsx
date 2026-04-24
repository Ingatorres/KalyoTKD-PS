import React, { useState } from 'react';
import { Event, PdfExportOptions } from '../types';
import { exportEventToPdf } from '../pdfExporter';
import { Header } from './Header';

interface PdfExportConfigScreenProps {
  event: Event;
  onCancel: () => void;
}

export const PdfExportConfigScreen: React.FC<PdfExportConfigScreenProps> = ({ event, onCancel }) => {
  const [options, setOptions] = useState<PdfExportOptions>({
    author: '',
    eventLogo: null,
    organizerLogo: null,
    includeJudges: true,
    includeSummary: true,
    includeMatchDetails: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'eventLogo' | 'organizerLogo') => {
    if (e.target.files && e.target.files[0]) {
      setOptions(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await exportEventToPdf(event, options);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
    }
  };

  const inputStyles = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-black";
  const checkboxStyles = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Configuración del Informe PDF</h2>

          <div className="space-y-6">
            {/* --- Autor y Logos --- */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">Nombre del Autor del Informe (Opcional)</label>
              <input
                type="text"
                id="author"
                value={options.author}
                onChange={(e) => setOptions(prev => ({ ...prev, author: e.target.value }))}
                className={inputStyles}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="eventLogo" className="block text-sm font-medium text-gray-700">Logo del Evento (Opcional)</label>
                <input
                  type="file"
                  id="eventLogo"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={(e) => handleFileChange(e, 'eventLogo')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label htmlFor="organizerLogo" className="block text-sm font-medium text-gray-700">Logo del Organizador (Opcional)</label>
                <input
                  type="file"
                  id="organizerLogo"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={(e) => handleFileChange(e, 'organizerLogo')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            {/* --- Opciones de Contenido --- */}
            <fieldset className="border-t pt-6">
              <legend className="text-lg font-medium text-gray-900">Contenido a Incluir</legend>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="includeJudges" type="checkbox" checked={options.includeJudges} onChange={(e) => setOptions(prev => ({ ...prev, includeJudges: e.target.checked }))} className={checkboxStyles} />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="includeJudges" className="font-medium text-gray-700">Información de Jueces y Jefe de Área</label>
                    <p className="text-gray-500">Incluye la tabla con los nombres de los jueces.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="includeSummary" type="checkbox" checked={options.includeSummary} onChange={(e) => setOptions(prev => ({ ...prev, includeSummary: e.target.checked }))} className={checkboxStyles} />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="includeSummary" className="font-medium text-gray-700">Resumen General del Evento</label>
                    <p className="text-gray-500">Incluye la tabla con totales de categorías y competidores.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="includeMatchDetails" type="checkbox" checked={options.includeMatchDetails} onChange={(e) => setOptions(prev => ({ ...prev, includeMatchDetails: e.target.checked }))} className={checkboxStyles} />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="includeMatchDetails" className="font-medium text-gray-700">Desglose de Encuentros y Puntajes</label>
                    <p className="text-gray-500">Muestra tablas detalladas para cada encuentro o ronda.</p>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* --- Acciones --- */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                onClick={onCancel}
                className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300"
                disabled={isGenerating}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition duration-300 disabled:bg-green-300"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generando...' : 'Generar PDF'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};