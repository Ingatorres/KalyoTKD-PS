import React, { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Event, Category, Screen, CompetitionSystem, PoomsaeConfig } from '../types';
import { Header } from './Header';
import { exportCategoryToExcel } from '../excelExporter';
import { exportCategoryToPdf, exportMultipleCategoriesToPdf, exportFinalResultsToPdf } from '../pdfExporterEnhanced';
import { exportCategoryToJson, exportMultipleCategoriesToJson } from '../jsonExporter';
import { ExportChoiceModal } from './ExportChoiceModal';
import { sortCategories } from '../categorySorter';
import { validateCategoryUniqueness, getValidationErrorMessage } from '../categoryValidator';
import { selectExportDirectory } from '../tauriUtils';
import { getKyorugiAgeGroups, getKyorugiWeights } from '../src/kyorugiLogic';
import { generateGlobalNumbering } from '../src/kyorugiNumbering';

interface CategoryScreenProps {
  event: Event | null;
  isActivated: boolean;
  updateCategory: (category: Category) => void;
  updateEvent: (event: Event) => void;
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
    onBulkSelect: (ids: string[], select: boolean) => void;
    onAction: (categoryId: string, actionType: 'start' | 'continue' | 'view' | 'export') => void;
    onDelete: (categoryId: string) => void;
    actionText: string;
    actionButtonClass: string;
    onExport: (id: string) => void;
}> = ({ title, borderColor, categories, onAction, actionText, actionButtonClass, event, selectedCategories, onToggleSelect, onBulkSelect, onDelete, onExport }) => {
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
                                <input 
                                    type="checkbox" 
                                    checked={categories.length > 0 && categories.every(c => selectedCategories.includes(c.id))}
                                    onChange={(e) => onBulkSelect(categories.map(c => c.id), e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    title="Seleccionar/Deseleccionar Todas en esta sección"
                                />
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
                                     <div className="flex items-center space-x-3">
                                        {event.status === 'completed' ? (
                                            <>
                                                <button onClick={() => onAction(cat.id, 'view')} className="text-gray-600 hover:text-gray-800" title="Ver Resultado">Resultados</button>
                                                <button onClick={() => onExport(cat.id)} className="text-blue-600 hover:text-blue-800 font-bold" title="Opciones de Exportación">Exportar</button>
                                            </>
                                        ) : (
                                            <>
                                                {cat.status === 'pending' && <button onClick={() => onAction(cat.id, 'start')} className={actionButtonClass}>{actionText}</button>}
                                                {cat.status === 'active' && (
                                                    <button onClick={() => onAction(cat.id, 'continue')} className="text-green-600 hover:text-green-800 font-bold" title="Continuar">Continuar</button>
                                                )}
                                                {cat.status === 'completed' && (
                                                    <>
                                                        <button onClick={() => onAction(cat.id, 'view')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" title="Ver Resultado">Resultados</button>
                                                        <button onClick={() => onExport(cat.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold" title="Opciones de Exportación">Exportar</button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        
                                        <button 
                                            onClick={() => onDelete(cat.id)}
                                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-500/10 rounded transition-colors"
                                            title="Eliminar Categoría"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
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


export const CategoryScreen: React.FC<CategoryScreenProps> = ({ event, isActivated, updateCategory, updateEvent, setScreen, setCurrentCategoryId, handleFinalizeEvent }) => {
  const [discipline, setDiscipline] = useState('Taekwondo');
  const [modality, setModality] = useState('Traditional');
  const [division, setDivision] = useState('Individual');
  const [gender, setGender] = useState('Femenino');
  const [ageGroup, setAgeGroup] = useState('Cadete (12-14)');
  const [beltLevel, setBeltLevel] = useState('Negro');
  const [weight, setWeight] = useState('Único');
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

  const handleBulkSelect = (ids: string[], select: boolean) => {
    setSelectedCategories(prev => {
        if (select) {
            // Add unique ids to selection
            return Array.from(new Set([...prev, ...ids]));
        } else {
            // Remove ids from selection
            return prev.filter(id => !ids.includes(id));
        }
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!event) return;
    const category = event.categories.find(c => c.id === categoryId);
    if (!category) return;

    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.title}"? Esta acción no se puede deshacer.`)) {
        const updatedEvent = {
            ...event,
            categories: event.categories.filter(c => c.id !== categoryId)
        };
        updateEvent(updatedEvent);
        // Also remove from selection if it was there
        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
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
    const weightPart = modality === 'Combate (Kyorugi)' ? `, ${weight}` : '';
    return `${discipline}${paraPart}, ${division}, ${gender}, ${ageGroup}, ${modality}${weightPart}, ${beltLevel}`;
  }, [discipline, modality, division, gender, ageGroup, beltLevel, disabilityGroup, weight]);

  // Handle dynamic age groups and weight limits
  const isKyorugi = modality === 'Combate (Kyorugi)';
  const ageOptions = isKyorugi ? getKyorugiAgeGroups() : ['Pre-cadete', 'Cadete (12-14)', 'Junior (15-17)', 'Under 30', 'Under 40', 'Under 50', 'Under 60', 'Under 65', 'Over 65'];
  const weightOptions = getKyorugiWeights(ageGroup, gender, discipline === 'Para-Taekwondo');

  useEffect(() => {
      if (isKyorugi && !ageOptions.includes(ageGroup)) setAgeGroup(ageOptions[0]);
      if (!isKyorugi && !ageOptions.includes(ageGroup)) setAgeGroup(ageOptions[0]);
  }, [isKyorugi]);

  useEffect(() => {
      if (isKyorugi && !weightOptions.includes(weight)) {
          setWeight(weightOptions[0] || 'Único');
      }
  }, [ageGroup, gender, discipline, isKyorugi]);

  const handleKyorugiNumbering = () => {
    if (!event) return;
    const kyorugiCats = event.categories.filter(c => c.modality === 'Combate (Kyorugi)' && c.pyramidMatches && c.pyramidMatches.length > 0);
    if (kyorugiCats.length === 0) {
        alert("No hay categorías de Combate (Kyorugi) con llaves generadas para enumerar.");
        return;
    }

    const choice = window.prompt("Opciones de Numeración de Combate:\n\n1. AUTOMÁTICA (Algoritmo de Intercalado por áreas)\n2. MANUAL (Borra la numeración actual para llenar a mano)\n\nIngrese 1 o 2:");
    
    if (choice === '2') {
        const isConfirm = window.confirm("Esto borrará la numeración actual de TODAS las llaves de Combate. ¿Desea continuar?");
        if (!isConfirm) return;

        const newEvent = JSON.parse(JSON.stringify(event)) as Event;
        newEvent.categories.forEach(c => {
            if (c.modality === 'Combate (Kyorugi)' && c.pyramidMatches) {
                c.pyramidMatches.forEach(m => {
                    m.matchNumber = undefined; // Clear the number
                });
            }
        });
        updateEvent(newEvent);
        alert("Numeración limpiada. Al exportar las pirámides a PDF, se generará un recuadro vacío para que puedas escribir el número a mano.");
        return;
    }

    if (choice === '1') {
        const input = window.prompt("¿Cuántas áreas (rings) estarán activas para el intercalado automático?\n(Ej: 2, 4, 6, 8)");
        if (!input) return;
        
        const numAreas = parseInt(input);
        if (isNaN(numAreas) || numAreas < 1) {
            alert("Por favor, ingresa un número de áreas válido.");
            return;
        }

        const newEvent = generateGlobalNumbering(event, numAreas);
        updateEvent(newEvent);
        alert(`Numeración Automática completada con éxito. Se intercalaron encuentros para ${numAreas} áreas.`);
    }
  };

  if (!event) {
    return <div>Cargando evento...</div>;
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const newCategory: Category = {
      id: uuidv4(),
      title: generatedTitle,
      discipline, modality, division, gender, ageGroup, beltLevel, system,
      weight: isKyorugi ? weight : undefined,
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
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            if (selectedCategories.length === event.categories.length) {
                                setSelectedCategories([]);
                            } else {
                                setSelectedCategories(event.categories.map(c => c.id));
                            }
                        }}
                        className="py-3 px-6 rounded-full font-bold border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition duration-300 text-xs uppercase tracking-widest"
                    >
                        {selectedCategories.length === event.categories.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                    </button>
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
                    
                    {event.categories.some(c => c.modality === 'Combate (Kyorugi)') && (
                        <button 
                            onClick={handleKyorugiNumbering}
                            className="bg-purple-600 text-white py-3 px-8 rounded-full font-bold shadow-lg hover:bg-purple-700 shadow-purple-900/20 transition duration-300 flex items-center gap-2 text-sm uppercase tracking-widest"
                            title="Intercalar número de encuentros para Combate (Kyorugi)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                            Numeración Kyorugi
                        </button>
                    )}
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
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modalidad</label><select value={modality} onChange={e => {setModality(e.target.value); if(e.target.value==='Combate (Kyorugi)') setSystem(CompetitionSystem.Pyramid)}} className={selectStyles}><option>Traditional</option><option>Freestyle</option><option>Combate (Kyorugi)</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">División</label><select value={division} onChange={e => setDivision(e.target.value)} className={selectStyles}><option>Individual</option><option>Pareja</option><option>Equipo</option><option>TK3</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label><select value={gender} onChange={e => setGender(e.target.value)} className={selectStyles}><option>Femenino</option><option>Masculino</option><option>Mixto</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Edad</label><select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={selectStyles}>{ageOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nivel (Cinturón)</label><select value={beltLevel} onChange={e => setBeltLevel(e.target.value)} className={selectStyles}><option>Principiante</option><option>Avanzado</option><option>Negro</option></select></div>
                
                {isKyorugi && (
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Peso (División)</label><select value={weight} onChange={e => setWeight(e.target.value)} className={selectStyles}>{weightOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                )}
                
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
                onBulkSelect={handleBulkSelect}
                onAction={handleCategoryAction}
                onDelete={handleDeleteCategory}
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
                onBulkSelect={handleBulkSelect}
                onAction={handleCategoryAction}
                onDelete={handleDeleteCategory}
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
        onSelectFinalResults={() => {
            const selectedCats = event.categories.filter(c => exportTargetIds.includes(c.id));
            exportFinalResultsToPdf(event, selectedCats);
        }}
      />
    </div>
  );
};