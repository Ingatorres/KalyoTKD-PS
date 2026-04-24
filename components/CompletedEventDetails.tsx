import React, { useState } from 'react';
import { Event, Screen } from '../types';
import { Header } from './Header';
import { PdfExportConfigScreen } from './PdfExportConfigScreen';

interface CompletedEventDetailsProps {
  event: Event;
  setScreen: (screen: Screen) => void;
}

export const CompletedEventDetails: React.FC<CompletedEventDetailsProps> = ({ event, setScreen }) => {
  const [showPdfConfig, setShowPdfConfig] = useState(false);

  if (showPdfConfig) {
    return <PdfExportConfigScreen event={event} onCancel={() => setShowPdfConfig(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Resumen del Evento: {event.name}</h2>
              <p className="text-sm text-gray-500">Estado: Finalizado</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPdfConfig(true)}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Generar Informe (PDF)
              </button>
              <button
                onClick={() => setScreen('EXISTING_EVENTS')}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 font-bold transition duration-300"
              >
                &larr; Volver a Eventos
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4">Categorías del Evento</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título de Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {event.categories.map(category => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.system}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};