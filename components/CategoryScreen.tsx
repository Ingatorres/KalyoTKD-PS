import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Event, Category, Screen, CompetitionSystem, PoomsaeConfig } from '../types';
import { Header } from './Header';
import { exportCategoryToExcel } from '../excelExporter';
import { exportCategoryToPdf, exportMultipleCategoriesToPdf } from '../pdfExporterEnhanced';
import { exportCategoryToJson, exportMultipleCategoriesToJson } from '../jsonExporter';
import { ExportChoiceModal } from './ExportChoiceModal';
import { sortCategories } from '../categorySorter';
import { validateCategoryUniqueness, getValidationErrorMessage } from '../categoryValidator';
import { selectExportDirectory } from '../tauriUtils';

interface CategoryScreenProps {
  event: Event | null;
  isActivated: boolean;
  updateCategory: (category: Category) => void;
  setScreen: (screen: Screen) => void;
  setCurrentCategoryId: (id: string) => void;
  handleFinalizeEvent: () => void;
}

const TableBlock: React.FC<{
    title: string;
    borderColor: 'blue' | 'red';
    categories: Category[];
    event: Event;
    selectedCategories: string[];
    onToggleSelect: (id: string) => void;
    onAction: (categoryId: string, actionType: 'start' | 'continue' | 'view' | 'export') => void;
    actionText: string;
    actionButtonClass: string;
    onExport: (id: string) => void;
}> = ({ title, borderColor, categories, onAction, actionText, actionButtonClass, event, selectedCategories, onToggleSelect, onExport }) => {
    const borderClass = borderColor === 'blue' ? 'border-blue-500' : 'border-red-500';
    const textClass = borderColor === 'blue' ? 'text-blue-800' : 'text-red-800';

    return (
        <div className={`border-t-4 ${borderClass} bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md transition-colors duration-300`}>
            <h3 className={`text-xl font-bold ${textClass} dark:text-blue-400 mb-4`}>{title}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <span className="sr-only">Seleccionar</span>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título de Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sistema de Competencia</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {categories.map(cat => (
                            <tr key={cat.id} className={selectedCategories.includes(cat.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCategories.includes(cat.id)} 
                                        onChange={() => onToggleSelect(cat.id)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 font-semibold">{cat.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cat.system}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{cat.status === 'pending' ? 'Pendiente' : (cat.status === 'active' ? 'En Proceso' : 'Finalizada')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {event.status === 'completed' ? (
                                        <div className="flex items-center space-x-4">
                                            <button onClick={() => onAction(cat.id, 'view')} className="text-gray-600 hover:text-gray-800" title="Ver Resultado">Resultados</button>
                                            <button onClick={() => onExport(cat.id)} className="text-blue-600 hover:text-blue-800 font-bold" title="Opciones de Exportación">Exportar</button>
                                        </div>
                                    ) : (
                                        <>
                                            {cat.status === 'pending' && <button onClick={() => onAction(cat.id, 'start')} className={actionButtonClass}>{actionText}</button>}
                                            {cat.status === 'active' && (
                                                <button onClick={() => onAction(cat.id, 'continue')} className="text-green-600 hover:text-green-800" title="Continuar">Continuar</button>
                                            )}
                                            {cat.status === 'completed' && (
                                                <div className="flex items-center space-x-4">
                                                    <button onClick={() => onAction(cat.id, 'view')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" title="Ver Resultado">Resultados</button>
                                                    <button onClick={() => onExport(cat.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold" title="Opciones de Exportación">Exportar</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">No hay categorías en este estado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export const CategoryScreen: React.FC<CategoryScreenProps> = ({ event, isActivated, updateCategory, setScreen, setCurrentCategoryId, handleFinalizeEvent }) => {
  const [discipline, setDiscipline] = useState('Taekwondo');
  const [modality, setModality] = useState('Traditional');
  const [division, setDivision] = useState('Individual');
  const [gender, setGender] = useState('Femenino');
  const [ageGroup, setAgeGroup] = useState('Cadete (12-14)');
  const [beltLevel, setBeltLevel] = useState('Negro');
  const [system, setSystem] = useState<CompetitionSystem>(CompetitionSystem.Rounds);
  const [disabilityGroup, setDisabilityGroup] = useState('P10');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [exportTargetIds, setExportTargetIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedCategories(prev => 
        prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const handleBulkExportClick = () => {
    if (selectedCategories.length === 0) {
        alert("Seleccione al menos una categoría para exportar.");
        return;
    }
    setExportTargetIds(selectedCategories);
    setIsChoiceModalOpen(true);
  };

  const executeBulkExport = async (format: 'pdf' | 'excel' | 'json') => {
    let targetDir: string | undefined = undefined;
    // @ts-ignore
    if (window.__TAURI__) {
        const dir = await selectExportDirectory();
        if (!dir) return;
        targetDir = dir;
    }

    alert(`Exportando ${exportTargetIds.length} categorías en formato ${format.toUpperCase()}...`);

    const selectedCats = event.categories.filter(c => exportTargetIds.includes(c.id));
    const sortedCategories = sortCategories(selectedCats);

    try {
        if (format === 'pdf' && sortedCategories.length > 1) {
            await exportMultipleCategoriesToPdf(event, sortedCategories, { author: event.registrarName }, targetDir);
        } else if (format === 'json' && sortedCategories.length > 1) {
            await exportMultipleCategoriesToJson(event, sortedCategories);
        } else {
            // Individual exports for Excel or single items
            for (const cat of sortedCategories) {
                if (format === 'pdf') {
                    await exportCategoryToPdf(event, cat, cat.pyramidMatches || [], { author: event.registrarName }, targetDir);
                } else if (format === 'excel') {
                    await exportCategoryToExcel(event, cat, targetDir);
                } else if (format === 'json') {
                    await exportCategoryToJson(event, cat);
                }
                // Small delay to ensure FS stability
                await new Promise(r => setTimeout(r, 400));
            }
        }
        alert(`¡Exportación de ${sortedCategories.length} categorías completada con éxito!`);
    } catch (e) {
        console.error(`Error en la exportación masiva:`, e);
        alert("Ocurrió un error durante la exportación.");
    }
  };



  const generatedTitle = useMemo(() => {
    const paraPart = discipline === 'Para-Taekwondo' ? `, ${disabilityGroup}` : '';
    return `${discipline}${paraPart}, ${division}, ${gender}, ${ageGroup}, ${modality}, ${beltLevel}`;
  }, [discipline, modality, division, gender, ageGroup, beltLevel, disabilityGroup]);

  if (!event) {
    return <div>Cargando evento...</div>;
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const newCategory: Category = {
      id: uuidv4(),
      title: generatedTitle,
      discipline, modality, division, gender, ageGroup, beltLevel, system,
      poomsaeConfig: { count: 1, useLottery: true, poomsaes: [null, null]},
      competitors: [],
      scores: [],
      pyramidMatches: [],
      status: 'pending'
    };
    if (discipline === 'Para-Taekwondo') {
        newCategory.disabilityGroup = disabilityGroup;
    }

    // --- RULE OF GOLD: PREVENT DUPLICATES ---
    const validationErrors = validateCategoryUniqueness(newCategory, event.categories || []);
    if (validationErrors.length > 0) {
        alert(getValidationErrorMessage(validationErrors));
        return;
    }

    const eventWithNewCategory = {...event, categories: [...event.categories, newCategory]};
    // This is not ideal, but we have to update the whole event
    // In a real DB scenario, we would just add the category.
    // Let's find a way to just update the category.
    const parentEvent = {
        ...event,
        categories: [...event.categories, newCategory]
    }
    // A bit of a hack, but let's pass the category to a dedicated updater
    updateCategory(newCategory);
  };
  
  const handleCategoryAction = (categoryId: string, actionType: 'start' | 'continue' | 'view' | 'export') => {
     setCurrentCategoryId(categoryId);
     switch (actionType) {
        case 'start':
            setScreen('POOMSAE_CONFIG');
            break;
        case 'continue':
            // For pyramid, continuing might mean setting up the next match.
            // For rounds, it goes straight to the competition screen.
            const category = event.categories.find(c => c.id === categoryId);
            if (category?.system === CompetitionSystem.Pyramid) {
                 setScreen('POOMSAE_CONFIG');
            } else {
                 setScreen('COMPETITION');
            }
            break;
        case 'view':
            setScreen('RESULTS_VIEWER');
            break;
        case 'export':
            const categoryToExport = event.categories.find(c => c.id === categoryId);
            if (categoryToExport) {
                exportCategoryToExcel(event, categoryToExport);
            }
            break;
     }
  };

  const selectStyles = "mt-1 p-2 w-full border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors";

  const createdCategories = event.categories.filter(c => c.status === 'pending');
  const inProgressCategories = event.categories.filter(c => c.status === 'active' || c.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e1424] transition-colors duration-300">
      <Header />
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{event.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">Crea y gestiona las categorías de la competencia.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
                {event.status === 'active' && (
                <button 
                    onClick={handleFinalizeEvent} 
                    className="bg-red-600 text-white py-2 px-8 rounded-full hover:bg-red-700 font-bold shadow-lg shadow-red-900/20 transition duration-300"
                >
                    Finalizar Evento
                </button>
                )}
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleBulkExportClick}
                        disabled={selectedCategories.length === 0}
                        className={`py-3 px-8 rounded-full font-bold shadow-lg transition duration-300 flex items-center gap-2 text-sm uppercase tracking-widest ${
                            selectedCategories.length > 0 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exportar Seleccionadas ({selectedCategories.length})
                    </button>
                </div>

                {event.status === 'completed' && (
                <button 
                    onClick={() => setScreen('HOME')} 
                    className="bg-green-600 text-white py-2 px-8 rounded-full hover:bg-green-700 font-bold shadow-lg shadow-green-900/20 transition duration-300"
                >
                    Volver a Inicio
                </button>
                )}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2 mb-4">Nueva Categoría</h3>
            {!isActivated && (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                    <span className="font-medium">Licencia Expirada.</span> No puede crear nuevas categorías. Por favor, reactive el software.
                    <button onClick={() => setScreen('ACTIVATION')} className="ml-4 font-bold underline">Reactivar ahora</button>
                </div>
            )}
            <fieldset disabled={!isActivated}>
                <form onSubmit={handleCreateCategory} className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!isActivated ? 'opacity-50' : ''}`}>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disciplina</label><select value={discipline} onChange={e => setDiscipline(e.target.value)} className={selectStyles}><option>Taekwondo</option><option>Para-Taekwondo</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modalidad</label><select value={modality} onChange={e => setModality(e.target.value)} className={selectStyles}><option>Traditional</option><option>Freestyle</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">División</label><select value={division} onChange={e => setDivision(e.target.value)} className={selectStyles}><option>Individual</option><option>Pareja</option><option>Equipo</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label><select value={gender} onChange={e => setGender(e.target.value)} className={selectStyles}><option>Femenino</option><option>Masculino</option><option>Mixto</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Edad</label><select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={selectStyles}><option>Pre-cadete</option><option>Cadete (12-14)</option><option>Junior (15-17)</option><option>Under 30</option><option>Under 40</option><option>Under 50</option><option>Under 60</option><option>Under 65</option><option>Over 65</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nivel (Cinturón)</label><select value={beltLevel} onChange={e => setBeltLevel(e.target.value)} className={selectStyles}><option>Principiante</option><option>Avanzado</option><option>Negro</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sistema</label><select value={system} onChange={e => setSystem(e.target.value as CompetitionSystem)} className={selectStyles}><option>{CompetitionSystem.Rounds}</option><option>{CompetitionSystem.Pyramid}</option></select></div>
                
                {discipline === 'Para-Taekwondo' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Grupos de Discapacidad</label>
                        <select value={disabilityGroup} onChange={e => setDisabilityGroup(e.target.value)} className={selectStyles}>
                            <option value="P10">Visuales P10</option>
                            <option value="P20">Intelectuales P20</option>
                            <option value="P30">Neurológicas P30</option>
                            <option value="P40">Físicas P40</option>
                            <option value="P50">Asistencia P50</option>
                            <option value="P60">Sordos P60</option>
                            <option value="P70">Baja estatura P70</option>
                        </select>
                    </div>
                )}


                <div className="col-span-full bg-gray-100 dark:bg-slate-700 p-3 rounded mt-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Título Generado: <span className="font-normal">{generatedTitle}</span></p>
                </div>
                <div className="col-span-full flex justify-end">
                    <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">Guardar Categoría</button>
                </div>
                </form>
            </fieldset>
        </div>

        {/* Categories Tables */}
        <div className="space-y-8">
            <TableBlock
                event={event}
                title="Categorías Creadas"
                borderColor="blue"
                categories={createdCategories}
                selectedCategories={selectedCategories}
                onToggleSelect={handleToggleSelect}
                onAction={handleCategoryAction}
                actionText="Comenzar"
                actionButtonClass="bg-blue-600 text-white py-1 px-4 rounded hover:bg-blue-700"
                onExport={(id) => { setExportTargetIds([id]); setIsChoiceModalOpen(true); }}
            />
             <TableBlock
                event={event}
                title="Categorías Finalizadas o en Proceso"
                borderColor="red"
                categories={inProgressCategories}
                selectedCategories={selectedCategories}
                onToggleSelect={handleToggleSelect}
                onAction={handleCategoryAction}
                actionText="Continuar"
                actionButtonClass="bg-red-600 text-white py-1 px-4 rounded hover:bg-red-700"
                onExport={(id) => { setExportTargetIds([id]); setIsChoiceModalOpen(true); }}
            />
        </div>
      </main>

      <ExportChoiceModal 
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        onSelectPdf={() => executeBulkExport('pdf')}
        onSelectExcel={() => executeBulkExport('excel')}
        onSelectJson={() => executeBulkExport('json')}
      />
    </div>
  );
};