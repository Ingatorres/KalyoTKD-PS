/**
 * components/BracketPdfExportModal.tsx
 * 
 * Modal for exporting initial bracket PDF with logos
 * Material Design 3 - Kalyo Connect Theme
 * Allows users to upload event logo, system logo (Kalyo), and league logo
 */

import React, { useState } from 'react';
import { Event, Category, PyramidMatch } from '../types';
import { exportCategoryToPdf } from '../pdfExporterEnhanced';

interface BracketPdfExportModalProps {
  isOpen: boolean;
  event: Event;
  category: Category;
  pyramidMatches: PyramidMatch[];
  onClose: () => void;
  onExportSuccess?: () => void;
}

export const BracketPdfExportModal: React.FC<BracketPdfExportModalProps> = ({
  isOpen,
  event,
  category,
  pyramidMatches,
  onClose,
  onExportSuccess
}) => {
  const [eventLogo, setEventLogo] = useState<string>('');
  const [leagueLogo, setLeagueLogo] = useState<string>('');
  const [authorName, setAuthorName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handleFileUpload = (
    file: File,
    setLogo: (data: string) => void,
    logoType: string
  ) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setLogo(base64);
      setExportStatus(`✓ Logo de ${logoType} cargado`);
      setTimeout(() => setExportStatus(''), 2000);
    };
    reader.onerror = () => {
      setExportStatus(`Error al cargar logo de ${logoType}`);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('Generando PDF...');

      await exportCategoryToPdf(event, category, pyramidMatches, {
        eventLogo: eventLogo || undefined,
        leagueLogo: leagueLogo || undefined,
        author: authorName || undefined
      });

      setExportStatus('PDF exportado correctamente');
      setTimeout(() => {
        onExportSuccess?.();
        onClose();
      }, 1500);
    } catch (error: any) {
      setExportStatus(`Error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-outline-variant/30 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-primary to-primary/90 text-white p-8 flex justify-between items-center rounded-t-3xl">
          <div>
            <h2 className="text-3xl font-black">Exportar PDF - Bracket</h2>
            <p className="text-sm text-white/80 mt-1">{category.title} • {pyramidMatches.length} encuentros</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {/* Event Info */}
          <div className="bg-primary/5 border-l-4 border-primary rounded-xl p-6">
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest mb-2">Evento</p>
            <p className="text-lg font-black text-on-surface">{event.name}</p>
            <p className="text-sm text-on-surface-variant mt-2">
              {category.competitors.length} competidores &bull; {pyramidMatches.length} encuentros
            </p>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-on-surface text-lg">Cargar Logos</h3>
                <p className="text-xs text-on-surface-variant">Opcionales - Aparecerán en el encabezado del PDF</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Event Logo */}
              <LogoUploadField
                logo={eventLogo}
                setLogo={setEventLogo}
                label="Logo del Evento"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                onUpload={(file) => handleFileUpload(file, setEventLogo, 'Evento')}
              />

              {/* League Logo */}
              <LogoUploadField
                logo={leagueLogo}
                setLogo={setLeagueLogo}
                label="Logo de la Liga/Organizador"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                onUpload={(file) => handleFileUpload(file, setLeagueLogo, 'Liga')}
              />
            </div>
          </div>

          {/* Author Name */}
          <div>
            <label className="text-xs font-black text-on-surface uppercase tracking-wider block mb-3">
              Generador del Reporte (opcional)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej: Juez Principal, Registrador, etc."
              className="w-full px-4 py-3 border-2 border-outline-variant rounded-xl bg-surface-container text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>


          {/* Format Info */}
          <div className="bg-primary/5 border-l-4 border-primary rounded-xl p-6">
            <p className="font-black text-on-surface text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Formato del PDF
            </p>
            <ul className="space-y-2 text-xs text-on-surface-variant list-disc pl-4">
              <li>Tamaño: Carta (8.5" x 11") - Orientación Horizontal</li>
              <li>Página Única: Todo el contenido en una sola hoja</li>
              <li>Diseño Limpio: Fondo blanco con bloques de competencia estructurados</li>
            </ul>
          </div>

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
            disabled={isExporting}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-outline-variant/50 disabled:cursor-not-allowed text-white rounded-2xl font-black transition-colors uppercase text-xs tracking-wider"
          >
            {isExporting ? 'Generando PDF...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Logo Upload Field Component */
interface LogoUploadFieldProps {
  logo: string;
  setLogo: (data: string) => void;
  label: string;
  icon: React.ReactNode;
  onUpload: (file: File) => void;
}

const LogoUploadField: React.FC<LogoUploadFieldProps> = ({
  logo,
  setLogo,
  label,
  icon,
  onUpload
}) => {
  return (
    <label className="block">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        className="hidden"
      />
      <div className={`
        border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all text-center
        ${logo 
          ? 'border-primary/30 bg-primary/5' 
          : 'border-outline-variant/30 hover:border-primary/50 bg-surface-container'
        }
      `}>
        <div className="mb-2 flex justify-center">{icon}</div>
        <p className="font-black text-on-surface text-sm uppercase tracking-wider">{label}</p>
        {logo ? (
          <p className="text-xs text-sky-blue font-bold mt-2">Cargado correctamente</p>
        ) : (
          <p className="text-xs text-on-surface-variant mt-2">Click para subir o arrastra la imagen</p>
        )}
      </div>
    </label>
  );
};
