import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Event, Category, Screen, CompetitionSystem, Competitor, PoomsaeConfig, PyramidMatch } from '../types';
import { Header } from './Header';
import { getPoomsaeList, drawPoomsaes } from '../data/poomsaeData'; 
import { generatePyramidBrackets } from "../src/pyramidGenerator";
import { resetMatchInPyramid } from '../src/pyramidLogic';
import { updatePdi, importCsvFile } from '../tauriUtils';
import Papa from 'papaparse';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PyramidBracket } from './PyramidBracket';
import { BracketPdfExportModal } from './BracketPdfExportModal';

interface PoomsaeConfigScreenProps {
  event: Event;
  category: Category;
  updateCategory: (category: Category) => void;
  setScreen: (screen: Screen) => void;
  setCurrentMatchId: (id: string | null) => void;
}

const DraggableCompetitor = ({ id, competitor, onDelete }: { id: string, competitor: Competitor, onDelete?: () => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return <div ref={setNodeRef} style={style} className={`p-2 rounded shadow-sm text-slate-900 dark:text-white border truncate max-w-full flex items-center justify-between ${competitor.hasWarning ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400' : 'bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600'}`}>
        <div {...attributes} {...listeners} className="flex-1 truncate cursor-move flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            <div className="truncate">
                <span className="font-bold">{competitor.name || '---'}</span>
                <span className="text-xs ml-2 opacity-70">({competitor.delegation || 'S/D'})</span>
            </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
            {competitor.hasWarning && (
                <span title={competitor.warningMessage || "Revisar datos"} className="text-amber-600 dark:text-amber-400 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </span>
            )}
            {onDelete && (
                <button 
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
                    onClick={onDelete} 
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-500/10 rounded transition-colors"
                    title="Eliminar competidor"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
    </div>;
};

const PHASE_ORDER = ['16avos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final'];

const getPhaseFromCompetitorCount = (count: number): string => {
    if (count <= 2) return 'Final';
    if (count <= 4) return 'Semifinal';
    if (count <= 8) return 'Cuartos de Final';
    if (count <= 16) return 'Octavos de Final';
    if (count <= 32) return '16avos de Final';
    return 'Ronda Preliminar'; // Fallback for > 32
};


export const PoomsaeConfigScreen: React.FC<PoomsaeConfigScreenProps> = ({ event, category, updateCategory, setScreen, setCurrentMatchId }) => {
  const [poomsaeConfig, setPoomsaeConfig] = useState<PoomsaeConfig>(category.poomsaeConfig);
  
  // State for Drag-and-Drop Seeding
  const [originalCompetitors, setOriginalCompetitors] = useState<Competitor[]>(category.competitors || []);
  const [isSeedingMode, setIsSeedingMode] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // State for Rounds system
  const [numCompetitors, setNumCompetitors] = useState(category.competitors.length > 0 ? category.competitors.length : 2);
  const [competitors, setCompetitors] = useState<Competitor[]>(category.competitors.length > 0 ? category.competitors : Array(2).fill({}).map(() => ({ id: uuidv4(), name: '', delegation: '' })));
  
  // State for Pyramid system (manual match)
  const [phase, setPhase] = useState(() => getPhaseFromCompetitorCount(category.competitors.length));
  const [matchNumber, setMatchNumber] = useState((category.pyramidMatches?.length || 0) + 1);
  const [competitorBlue, setCompetitorBlue] = useState<Competitor>({ id: uuidv4(), name: '', delegation: '' });
  const [competitorRed, setCompetitorRed] = useState<Competitor>({ id: uuidv4(), name: '', delegation: '' });
   const [byeWinner, setByeWinner] = useState<'blue' | 'red' | null>(null);

  // New state for pyramid entry mode
  const [entryMode, setEntryMode] = useState<'manual' | 'dropdown'>('manual');
  const [availableWinners, setAvailableWinners] = useState<Competitor[]>([]);

  const poomsaeOptions = useMemo(() => getPoomsaeList(category), [category]);

  // --- Drag and Drop Sensors and Handler ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setCompetitors((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Determine if it's a Freestyle or Kyorugi category (both skip Poomsae logic)
  const isFreestyle = category.modality === 'Freestyle';
  const isKyorugi = category.modality === 'Combate (Kyorugi)';
  const skipPoomsaeConfig = isFreestyle || isKyorugi;

  // Effect to set poomsaeConfig for Freestyle and Kyorugi
  React.useEffect(() => {
    if (skipPoomsaeConfig) {
      setPoomsaeConfig(prevConfig => ({
        ...prevConfig,
        useLottery: false, // These don't use lottery
        poomsaes: [], // No poomsaes needed
      }));
    }
  }, [skipPoomsaeConfig]);

  const handleNumCompetitorsChange = (num: number) => {
    const newNum = Math.max(2, num);
    setPhase(getPhaseFromCompetitorCount(newNum));
    setNumCompetitors(newNum);
    const currentCompetitors = [...competitors];
    if (newNum > currentCompetitors.length) {
        const newEntries = Array(newNum - currentCompetitors.length).fill({}).map(() => ({ id: uuidv4(), name: '', delegation: '' }));
        setCompetitors([...currentCompetitors, ...newEntries]);
    } else {
        setCompetitors(currentCompetitors.slice(0, newNum));
    }
  };

  const handleCompetitorChange = (index: number, field: 'name' | 'delegation', value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index][field] = value;
    setCompetitors(newCompetitors);
  };

  const handleDeleteCompetitor = (index: number) => {
    if (competitors.length <= 2 && category.system === CompetitionSystem.Pyramid) {
        alert("Se necesitan al menos 2 competidores para una llave de pirámide.");
        return;
    }
    const newCompetitors = competitors.filter((_, i) => i !== index);
    setCompetitors(newCompetitors);
    setNumCompetitors(newCompetitors.length);
    setPhase(getPhaseFromCompetitorCount(newCompetitors.length));
    
    // Auto-update category competitors
    updateCategory({ ...category, competitors: newCompetitors });
  };

  const handleAddCompetitor = () => {
    const newComp: Competitor = { id: uuidv4(), name: '', delegation: '' };
    const newCompetitors = [...competitors, newComp];
    setCompetitors(newCompetitors);
    setNumCompetitors(newCompetitors.length);
    setPhase(getPhaseFromCompetitorCount(newCompetitors.length));
    
    // Auto-update category competitors
    updateCategory({ ...category, competitors: newCompetitors });
  };

  const handleImportCompetitors = async () => {
    const fileContent = await importCsvFile();

    if (!fileContent) {
      return; // User cancelled or not in Tauri environment
    }

    try {
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().trim(),
            complete: (results) => {
                const importedData = results.data as { nombre: string; delegacion: string }[];
                
                if (importedData.length === 0 || !importedData[0].nombre || !importedData[0].delegacion) {
                    alert('El archivo CSV está vacío o no tiene las columnas "nombre" y "delegacion".');
                    return;
                }

                const newCompetitors: Competitor[] = importedData.map(row => ({
                    id: uuidv4(),
                    name: row.nombre.trim(),
                    delegation: row.delegacion.trim(),
                }));

                setCompetitors(newCompetitors);
                setOriginalCompetitors(newCompetitors); // Save the original order
                setPhase(getPhaseFromCompetitorCount(newCompetitors.length));
                setNumCompetitors(newCompetitors.length);
                // --- FIX: Save competitors to the category state immediately ---
                const updatedCategory = { ...category, competitors: newCompetitors };
                setIsSeedingMode(true); // Activate seeding mode after import
                // --- NEW: Switch to dropdown entry mode to allow manual seeding ---
                setEntryMode('dropdown');
                updateCategory(updatedCategory);
                alert(`${newCompetitors.length} competidores importados correctamente.`);
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
                alert(`Error al procesar el archivo CSV: ${error.message}`);
            }
        });
    } catch (err) {
        console.error("Error processing imported file:", err);
        alert("Ocurrió un error al procesar el archivo CSV.");
    }
  };
  
  const handleProcessPaste = () => {
    if (!pastedText.trim()) {
        alert("Por favor, pegue los datos de los competidores.");
        return;
    }

    Papa.parse<string[]>(pastedText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
            // Always store as individuals to allow manual reordering
            const rawData = results.data
                .map(row => ({ name: (row[0] || '').trim(), delegation: (row[1] || '').trim() }))
                .filter(row => row.name);
            
            const individualCompetitors: Competitor[] = rawData.map(row => ({
                id: uuidv4(),
                name: row.name,
                delegation: row.delegation || 'SIN CLUB',
            }));

            if (individualCompetitors.length === 0) {
                alert("No se encontraron datos válidos.");
                return;
            }

            setCompetitors(individualCompetitors);
            setOriginalCompetitors(individualCompetitors);
            setNumCompetitors(individualCompetitors.length);
            setIsSeedingMode(true);
            setEntryMode('dropdown');
            updateCategory({ ...category, competitors: individualCompetitors });
            
            alert(`${individualCompetitors.length} integrantes procesados. Puede arrastrarlos para organizar los grupos manualmente.`);
            setIsPasteModalOpen(false);
            setPastedText('');
        }
    });
  };
  
  // Helper to group individuals based on the current order and delegation boundaries
  const getGroupedCompetitors = (members: Competitor[], division: string): Competitor[] => {
      const divNorm = (division || '').toLowerCase();
      const isPareja = divNorm.includes('pareja');
      const isEquipo = divNorm.includes('equipo');
      const isTK3 = divNorm.includes('tk3');
      
      if (!isPareja && !isEquipo && !isTK3) return members;

      const groupSize = isPareja ? 2 : ((isEquipo || isTK3) ? 3 : 1);
      const grouped: Competitor[] = [];
      let i = 0;

      while (i < members.length) {
          const firstMember = members[i];
          const firstDel = firstMember.delegation || 'SIN CLUB';
          
          let currentGroup: Competitor[] = [firstMember];
          let isComplete = true;

          for (let j = 1; j < groupSize; j++) {
              const nextIdx = i + j;
              if (nextIdx < members.length && (members[nextIdx].delegation || 'SIN CLUB') === firstDel) {
                  currentGroup.push(members[nextIdx]);
              } else {
                  isComplete = false;
                  break;
              }
          }

          const names = currentGroup.map(m => m.name);
          const hasWarning = !isComplete;

          if (!isComplete) {
              for (let k = 0; k < (groupSize - currentGroup.length); k++) {
                  names.push(`DELEGADO (${firstDel})`);
              }
          }

          grouped.push({
              id: uuidv4(), 
              name: names.join(' / '),
              delegation: firstDel,
              hasWarning: hasWarning,
              warningMessage: hasWarning ? `Incompleto: Cambio de delegación o fin de lista.` : undefined
          });

          i += currentGroup.length;
      }
      return grouped;
  };

  const handleStartRoundsCompetition = () => {
    // Dynamically group based on current order
    const actualCompetitors = getGroupedCompetitors(competitors, category.division);
    
    // If it's already final, keep it final. Otherwise check competitor count.
    const isQualification = category.round !== 'final' && actualCompetitors.length > 8;
    const finalCategory = { 
        ...category,
        competitors: actualCompetitors,
        poomsaeConfig,
        status: 'active' as const,
        round: isQualification ? 'qualification' as const : 'final' as const
    };
    updateCategory(finalCategory);
    updatePdi({
      view: 'COMPETITION_START',
      data: {
        categoryTitle: category.title,
        poomsaes: poomsaeConfig.poomsaes,
        system: CompetitionSystem.Rounds,
      }
    });
    // The user will manually go back to the competition screen.
    // This prevents the PDI from resetting to IDLE immediately.
    setScreen('COMPETITION');
  };
  
  const handleSaveByeMatch = () => {
    if (!byeWinner) return;

    const newMatch: PyramidMatch = {
        id: uuidv4(), phase, matchNumber,
        competitorBlue: competitorBlue.name ? competitorBlue : null,
        competitorRed: competitorRed.name ? competitorRed : null,
        winner: byeWinner,
        byeWinner: byeWinner as 'blue' | 'red',
        isReady: false,
        nextMatchId: null,
        winnerTargetSlot: null,
    };

    const currentCompetitors = [...category.competitors];
    if (competitorBlue.name && competitorBlue.name !== 'BYE' && !currentCompetitors.some(c => c.id === competitorBlue.id)) {
        currentCompetitors.push(competitorBlue);
    }
    if (competitorRed.name && competitorRed.name !== 'BYE' && !currentCompetitors.some(c => c.id === competitorRed.id)) {
        currentCompetitors.push(competitorRed);
    }

    const isFinal = phase.toLowerCase() === 'final';
    const updatedCategory = {
        ...category,
        competitors: currentCompetitors,
        pyramidMatches: [...(category.pyramidMatches || []), newMatch],
        status: isFinal ? 'completed' as const : 'active' as const
    };
    updateCategory(updatedCategory);
    
    // Reset for next match
    setMatchNumber(prev => prev + 1);
    setCompetitorBlue({ id: uuidv4(), name: '', delegation: '' });
    setCompetitorRed({ id: uuidv4(), name: '', delegation: '' });
    setByeWinner(null);
  };


  // --- Quick Match Lookup ---
  const handleMatchNumberChange = (value: number) => {
    setMatchNumber(value);

    // Auto-fill competitors if match exists in generated bracket
    if (category.pyramidMatches && category.pyramidMatches.length > 0) {
        const existingMatch = category.pyramidMatches.find(m => m.matchNumber === value);
        if (existingMatch) {
            setCompetitorBlue(existingMatch.competitorBlue || { id: uuidv4(), name: '', delegation: '' });
            setCompetitorRed(existingMatch.competitorRed || { id: uuidv4(), name: '', delegation: '' });
            setPhase(existingMatch.phase);
            // If the match is already complete or ready, maybe we should warn?
            // For now, just loading the data allows re-editing or starting.
        }
    }
  };

  const handleStartPyramidAuto = () => {
    if (!category.pyramidMatches || category.pyramidMatches.length === 0) return;
    
    const nextMatch = category.pyramidMatches.find(m => m.isReady && !m.winner);
    
    if (!nextMatch) {
        alert("No hay encuentros listos para iniciar. ¡La pirámide puede haber finalizado o faltan ganadores de fases anteriores!");
        return;
    }

    if (!nextMatch.competitorBlue || !nextMatch.competitorRed) {
        alert(`El encuentro #${nextMatch.matchNumber} (${nextMatch.phase}) no tiene a ambos competidores listos.`);
        return;
    }

    handleStartPyramidMatch(nextMatch);
  };

  const handleStartPyramidMatch = (autoMatch?: PyramidMatch) => {
    const startBlue = autoMatch ? autoMatch.competitorBlue : competitorBlue;
    const startRed = autoMatch ? autoMatch.competitorRed : competitorRed;
    const startPhase = autoMatch ? autoMatch.phase : phase;
    const startMatchNumber = autoMatch ? autoMatch.matchNumber : matchNumber;

    if (!startBlue?.name || !startRed?.name) {
        alert("Debe seleccionar ambos competidores (Azul y Rojo) para iniciar el encuentro.");
        return;
    }

    // --- Per-Match Poomsae Draw Logic ---
    let currentPoomsaes = [...poomsaeConfig.poomsaes];
    const hasExistingDraw = currentPoomsaes.length > 0 && currentPoomsaes.every(p => p && p.trim() !== "");

    // Get poomsaes from the previous match to exclude them
    const previousMatch = category.pyramidMatches?.find(m => m.matchNumber === startMatchNumber - 1);
    const excludeList = previousMatch?.poomsaes?.filter((p): p is string => !!p) || [];

    if (poomsaeConfig.useLottery && !hasExistingDraw) {
        currentPoomsaes = drawPoomsaes(poomsaeConfig.count, poomsaeOptions, excludeList);
        
        // Notify PDI about the NEW draw only if we just did it
        void updatePdi({
            view: 'POOMSAE_DRAW',
            data: {
              categoryTitle: category.title,
              poomsaes: currentPoomsaes,
            }
        });
    }

    // Reset local draw so the NEXT match starts fresh
    if (poomsaeConfig.useLottery) {
        setPoomsaeConfig(prev => ({ ...prev, poomsaes: Array(prev.count).fill("") }));
    }

    const newMatch: PyramidMatch = {
        id: autoMatch ? autoMatch.id : uuidv4(),
        phase: startPhase,
        matchNumber: startMatchNumber,
        competitorBlue: startBlue,
        competitorRed: startRed,
        winner: null,
        isReady: true,
        nextMatchId: autoMatch?.nextMatchId || null,
        winnerTargetSlot: autoMatch?.winnerTargetSlot || null,
        poomsaes: currentPoomsaes, // Save the poomsaes used for this match
    };

    // Check if this match number already exists in the bracket to update it instead of creating duplicate
    let updatedMatches = [...(category.pyramidMatches || [])];
    const existingMatchIndex = updatedMatches.findIndex(m => m.matchNumber === startMatchNumber);
    
    if (existingMatchIndex !== -1) {
        // Update existing match
        updatedMatches[existingMatchIndex] = {
            ...updatedMatches[existingMatchIndex],
            competitorBlue: startBlue,
            competitorRed: startRed,
            isReady: true, 
            // We keep nextMatchId and other structural info if it existed
        };
        // Use the ID of the existing match
        newMatch.id = updatedMatches[existingMatchIndex].id;
    } else {
        // Add new match (fallback if not found in generated, though likely should be)
        updatedMatches.push(newMatch);
    }

    const currentCompetitors = [...category.competitors];
    if (startBlue?.name && startBlue?.name !== 'BYE' && !currentCompetitors.some(c => c.id === startBlue.id)) {
        currentCompetitors.push(startBlue);
    }
    if (startRed?.name && startRed?.name !== 'BYE' && !currentCompetitors.some(c => c.id === startRed.id)) {
        currentCompetitors.push(startRed);
    }

    const updatedCategory = {
        ...category,
        competitors: currentCompetitors,
        pyramidMatches: updatedMatches,
         // We update the category config with the NEWLY DRAWN poomsaes so they persist for this session/match context
        poomsaeConfig: { ...poomsaeConfig, poomsaes: currentPoomsaes },
        status: 'active' as 'active'
    };
    updateCategory(updatedCategory);
    setCurrentMatchId(newMatch.id);
    
    // We update PDI with Competition Start (using the drawn poomsaes)
    updatePdi({
      view: 'COMPETITION_START',
      data: {
        categoryTitle: category.title,
        poomsaes: currentPoomsaes,
        system: CompetitionSystem.Pyramid,
      }
    });

    // Give time for the Draw Animation (if any) or just start
    // If we did a draw, maybe show it for a few seconds? 
    // The user said "each match is a new draw".
    // Let's add a small delay if Lottery was used to let them see the "Sorteo" screen briefly if desired?
    // Currently the code logic just pushed POOMSAE_DRAW then COMPETITION_START. 
    // PDI might handle queue or just overwrite. 
    // Let's rely on standard flow.
    
    setTimeout(() => {
      setScreen('COMPETITION');
    }, 7000); // Wait for the animation to finish
  };

  const handleGeneratePyramidBrackets = () => {
    const actualCompetitors = getGroupedCompetitors(competitors, category.division);
    
    if (actualCompetitors.length < 2) {
      alert("Se necesitan al menos 2 competidores (o grupos) para generar una llave.");
      return;
    }

    const brackets = generatePyramidBrackets(actualCompetitors); // The function now respects the order by default

    const updatedCategory = {
        ...category, 
        competitors: actualCompetitors, // Save the grouped list
        pyramidMatches: brackets,
        status: 'active' as 'active'
    };
    updateCategory(updatedCategory);
    
    // Notify PDI about the new bracket
    updatePdi({
      view: 'PYRAMID_BRACKET',
      data: {
        categoryTitle: category.title,
        pyramidMatches: brackets,
      }
    });

    alert(`Llave generada con ${brackets.length} encuentros para ${competitors.length} competidores. Ahora puede revisarla antes de iniciar.`);

    // Set the first match but DO NOT change the screen automatically
    const firstMatch = brackets.find(m => m.isReady);
    if (firstMatch) {
        setCurrentMatchId(firstMatch.id);
    }
  };

  const handleResetMatch = (matchId: string) => {
    const updatedMatches = resetMatchInPyramid(category.pyramidMatches, matchId);
    const updatedCategory = {
        ...category,
        pyramidMatches: updatedMatches
    };
    updateCategory(updatedCategory);
    
    // Sync with PDI
    updatePdi({
      view: 'PYRAMID_BRACKET',
      data: {
        categoryTitle: category.title,
        pyramidMatches: updatedMatches,
      }
    });
    
    alert("Encuentro reiniciado. Puede volver a configurar e iniciar el encuentro.");
  };


  const handleStartFreestyleCompetition = () => {
    if (competitors.length === 0) {
      alert('Debe haber al menos un competidor para iniciar la presentación Freestyle.');
      return;
    }
    const firstCompetitor = competitors[0];
    updatePdi({
      view: 'FREESTYLE_PRESENTATION',
      data: {
        categoryTitle: category.title,
        competitorName: firstCompetitor.name,
        competitorDelegation: firstCompetitor.delegation,
      }
    });
    setTimeout(() => {
      setScreen('COMPETITION');
    }, 7000); // Wait for the animation to finish
  };

  const handlePoomsaeConfigChange = <K extends keyof PoomsaeConfig>(key: K, value: PoomsaeConfig[K]) => {
      const newConfig = { ...poomsaeConfig, [key]: value };
      if(key === 'count') {
          newConfig.poomsaes = value === 1 ? [newConfig.poomsaes[0]] : [newConfig.poomsaes[0], null];
      }
      setPoomsaeConfig(newConfig);
  }

  const handlePoomsaeSelection = (index: number, value: string) => {
      const newPoomsaes = [...poomsaeConfig.poomsaes];
      newPoomsaes[index] = value;
      setPoomsaeConfig({...poomsaeConfig, poomsaes: newPoomsaes});
  }
  
  const handleDraw = () => {
      // Find poomsaes used in the previous match to exclude them
      const previousMatch = category.pyramidMatches?.find(m => m.matchNumber === matchNumber - 1);
      const excludeList = previousMatch?.poomsaes?.filter((p): p is string => !!p) || [];

      const drawn = drawPoomsaes(poomsaeConfig.count, poomsaeOptions, excludeList);
      setPoomsaeConfig({...poomsaeConfig, poomsaes: drawn});
      void updatePdi({
        view: 'POOMSAE_DRAW',
        data: {
          categoryTitle: category.title,
          poomsaes: drawn,
        }
      });
  }

  const handleLoadWinners = () => {
    if (category.pyramidMatches.length === 0) {
        alert("No hay encuentros previos de los cuales cargar ganadores.");
        return;
    }

    const lastPhaseWithMatches = PHASE_ORDER.slice().reverse().find(p => 
        category.pyramidMatches.some(m => m.phase === p && m.winner)
    );

    if (!lastPhaseWithMatches) {
        alert("No se encontraron ganadores en la fase anterior.");
        return;
    }

    const winners = category.pyramidMatches
        .filter(m => m.phase === lastPhaseWithMatches && m.winner)
        .map(m => m.winner === 'blue' ? m.competitorBlue : m.competitorRed)
        .filter((c): c is Competitor => c !== null);

    const nextPhaseIndex = PHASE_ORDER.indexOf(lastPhaseWithMatches) + 1;
    if (nextPhaseIndex < PHASE_ORDER.length) {
        setPhase(PHASE_ORDER[nextPhaseIndex]);
    }

    setAvailableWinners(winners);
    setEntryMode('dropdown');
    setCompetitorBlue({ id: uuidv4(), name: '', delegation: '' });
    setCompetitorRed({ id: uuidv4(), name: '', delegation: '' });
  };

  const handleCompetitorSelection = (color: 'blue' | 'red', competitorId: string) => {
      // Use the same list that populates the dropdowns to find the selected competitor.
      const selectedCompetitor = competitorListForDropdown.find(c => c.id === competitorId);
      if (selectedCompetitor) {
          if (color === 'blue') {
              setCompetitorBlue(selectedCompetitor);
          } else {
              setCompetitorRed(selectedCompetitor);
          }
      }
  };

    const inputStyles = "mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const selectStyles = "mt-1 p-2 w-full border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

    const competitorListForDropdown = entryMode === 'dropdown' ? (availableWinners.length > 0 ? availableWinners : competitors) : competitors;
    const blueDropdownOptions = competitorListForDropdown.filter(c => c.id !== competitorRed.id);
    const redDropdownOptions = competitorListForDropdown.filter(c => c.id !== competitorBlue.id);

    const handleBracketUpdate = (newMatches: PyramidMatch[]) => {
        const updatedCategory = { ...category, pyramidMatches: newMatches };
        updateCategory(updatedCategory);
    };

    return (
    <div className="min-h-screen transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-10 pointer-events-none mix-blend-overlay"></div>
      <Header />
      <main className="max-w-5xl mx-auto py-8 px-6 relative z-10">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{category.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-light tracking-wide">Configuración de Poomsaes y Competencia</p>
        </div>

        {/* NEW: Seeding Interface */}
        {isSeedingMode && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl shadow-lg mb-8 border-l-4 border-amber-500 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Siembra Manual
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mt-2 mb-4 text-sm leading-relaxed">
                    Arrastre y suelte para reordenar la lista. Los primeros puestos obtendrán los BYEs disponibles.
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar p-1">
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={competitors} strategy={verticalListSortingStrategy}>
                            {(() => {
                                const isPareja = (category.division || '').toLowerCase().includes('pareja');
                                const isEquipo = (category.division || '').toLowerCase().includes('equipo');
                                const groupSize = isPareja ? 2 : (isEquipo ? 3 : 1);
                                
                                let currentGroupMembers: number = 0;
                                let currentDel: string = '';
                                
                                return competitors.map((c, index) => {
                                    const isNewGroupStart = currentGroupMembers === 0 || (groupSize > 1 && c.delegation !== currentDel) || currentGroupMembers === groupSize;
                                    
                                    if (isNewGroupStart) {
                                        currentGroupMembers = 1;
                                        currentDel = c.delegation;
                                    } else {
                                        currentGroupMembers++;
                                    }

                                    const showSeparator = isNewGroupStart && index > 0;
                                    const groupColor = groupSize > 1 ? (index % (groupSize * 2) < groupSize ? 'border-l-4 border-blue-500' : 'border-l-4 border-purple-500') : '';

                                    return (
                                        <React.Fragment key={c.id}>
                                            {showSeparator && <div className="border-t border-dashed border-amber-500/30 my-3"></div>}
                                            <div className={groupColor}>
                                                <DraggableCompetitor 
                                                    id={c.id} 
                                                    competitor={c} 
                                                    onDelete={() => handleDeleteCompetitor(index)}
                                                />
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </SortableContext>
                    </DndContext>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={() => setCompetitors(originalCompetitors)} className="text-amber-500 hover:text-amber-400 text-sm underline underline-offset-4">
                        Reiniciar Orden
                    </button>
                    <button onClick={() => setIsSeedingMode(false)} className="bg-slate-700/50 text-slate-300 py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors border border-white/5">Ocultar Siembra</button>
                </div>
            </div>
        )}
        {/* Poomsae Config Block (Common for all systems) */}
        {skipPoomsaeConfig ? (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl shadow-xl dark:shadow-xl mb-8 text-center border border-slate-200 dark:border-white/5">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Competencia sin Poomsaes</h3>
            <p className="text-slate-500 dark:text-slate-400">Esta modalidad ({category.modality}) no requiere configuración de Poomsaes ni sorteo.</p>
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl shadow-xl dark:shadow-xl mb-8 border border-slate-200 dark:border-white/5">
              <h3 className="font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/10 pb-4 mb-6 tracking-wide uppercase text-sm">Configuración de Poomsaes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Número de Poomsaes</label>
                      <div className="flex space-x-6 mt-2 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                         <label className="flex items-center text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-white"><input type="radio" name="poomsaeCount" value={1} checked={poomsaeConfig.count === 1} onChange={() => handlePoomsaeConfigChange('count', 1)} className="mr-3 w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-500 focus:ring-blue-500"/> 1 Poomsae</label>
                         <label className="flex items-center text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-white"><input type="radio" name="poomsaeCount" value={2} checked={poomsaeConfig.count === 2} onChange={() => handlePoomsaeConfigChange('count', 2)} className="mr-3 w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-500 focus:ring-blue-500"/> 2 Poomsaes</label>
                      </div>
                  </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Sorteo de Poomsaes</label>
                      <div className="flex items-center mt-2 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                          <input id="useLottery" type="checkbox" checked={poomsaeConfig.useLottery} onChange={(e) => handlePoomsaeConfigChange('useLottery', e.target.checked)} className="h-5 w-5 text-indigo-600 border-slate-300 dark:border-slate-500 rounded focus:ring-indigo-500 bg-white dark:bg-slate-800" />
                          <label htmlFor="useLottery" className="ml-3 block text-sm text-slate-700 dark:text-slate-200 cursor-pointer">Activar Sorteo Automático</label>
                      </div>
                  </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                  {poomsaeConfig.useLottery ? (
                      <div className="text-center">
                          <button onClick={handleDraw} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all w-full md:w-auto">
                              Realizar Sorteo
                          </button>
                          <div className="mt-6 p-4 bg-slate-900/80 rounded-xl border border-white/5 inline-block min-w-[300px]">
                              <p className="text-slate-400 text-sm uppercase tracking-wide mb-1">Poomsae Seleccionado</p>
                              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{poomsaeConfig.poomsaes.filter(p => p).join(' y ') || '---'}</span>
                          </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Array.from({ length: poomsaeConfig.count }).map((_, index) => {
                               const isPara = category.discipline === 'Para-Taekwondo';
                               const options = isPara ? (index === 0 ? poomsaeOptions.group1 : poomsaeOptions.group2) : poomsaeOptions.all;
                               const label = isPara ? `Poomsae (Grupo ${index + 1})` : `Poomsae ${index + 1}`;
                               return (
                                  <div key={index}>
                                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
                                      <select value={poomsaeConfig.poomsaes[index] || ''} onChange={e => handlePoomsaeSelection(index, e.target.value)} className={selectStyles}>
                                          <option value="" disabled>Seleccione un Poomsae</option>
                                          {options?.map(p => <option key={p} value={p}>{p}</option>)}
                                      </select>
                                  </div>
                               )
                          })}
                      </div>
                  )}
              </div>
          </div>
        )}

        {/* Competitor Configuration Block (Common for Rounds and Pyramid) */}
        {((category.system === CompetitionSystem.Rounds && category.round !== 'final') || (category.system === CompetitionSystem.Pyramid && !category.pyramidMatches.some(m => m.winner && !m.byeWinner))) ? (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl shadow-xl mb-8 border border-white/5">
                <div className="flex flex-wrap justify-between items-center border-b border-gray-200 dark:border-white/10 pb-4 mb-6 gap-4">
                    <h3 className="font-bold text-green-600 dark:text-green-400 tracking-wide uppercase text-sm">Configuración de Competidores</h3>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setIsPasteModalOpen(true)}
                            className="bg-slate-700 text-green-400 border border-green-500/30 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-green-500/10 transition-colors"
                        >
                            Pegar (Excel)
                        </button>
                        <button 
                            onClick={handleImportCompetitors}
                            className="bg-slate-700 text-teal-400 border border-teal-500/30 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-teal-500/10 transition-colors"
                        >
                            Importar (CSV)
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Número de Competidores</label>
                        <input type="number" value={numCompetitors} onChange={e => handleNumCompetitorsChange(parseInt(e.target.value))} min="2" className={inputStyles} />
                    </div>
                    <div className="pt-5">
                        <button 
                            onClick={handleAddCompetitor}
                            className="bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-600/20 transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Agregar Competidor
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {(() => {
                        const isPareja = (category.division || '').toLowerCase().includes('pareja');
                        const isEquipo = (category.division || '').toLowerCase().includes('equipo');
                        const isTK3 = (category.division || '').toLowerCase().includes('tk3');
                        const groupSize = isPareja ? 2 : ((isEquipo || isTK3) ? 3 : 1);
                        
                        let currentGroupMembers: number = 0;
                        let currentDel: string = '';
                        
                        return competitors.map((comp, index) => {
                            // Logic to check if this is the start of a group or same club
                            const isNewGroupStart = currentGroupMembers === 0 || (groupSize > 1 && comp.delegation !== currentDel) || currentGroupMembers === groupSize;
                            
                            if (isNewGroupStart) {
                                currentGroupMembers = 1;
                                currentDel = comp.delegation;
                            } else {
                                currentGroupMembers++;
                            }

                            const showSeparator = isNewGroupStart && index > 0;
                            const groupColor = groupSize > 1 ? (index % (groupSize * 2) < groupSize ? 'border-l-4 border-blue-500' : 'border-l-4 border-purple-500') : '';

                            return (
                                <React.Fragment key={comp.id}>
                                    {showSeparator && <div className="col-span-full border-t border-dashed border-gray-300 dark:border-white/10 my-2 h-1"></div>}
                                    <div className={`p-4 rounded-xl border transition-colors ${groupColor} ${comp.hasWarning ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-500/30' : 'bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-white/10'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-500 text-xs uppercase">
                                                {groupSize > 1 ? `Integrante ${currentGroupMembers}` : `Competidor ${index + 1}`}
                                            </h4>
                                            <button 
                                                onClick={() => handleDeleteCompetitor(index)} 
                                                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-500/10 rounded transition-colors"
                                                title="Eliminar competidor"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <input type="text" placeholder="Nombre" value={comp.name} onChange={e => handleCompetitorChange(index, 'name', e.target.value)} required className={inputStyles} />
                                            <input type="text" placeholder="Delegación" value={comp.delegation} onChange={e => handleCompetitorChange(index, 'delegation', e.target.value)} required className={inputStyles} />
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        });
                    })()}
                </div>
            </div>
        ) : null}

        {/* Block for PYRAMID system */}
        {category.system === CompetitionSystem.Pyramid && (
            <>
            {category.pyramidMatches && category.pyramidMatches.length > 0 ? (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3">
                            <span className="text-purple-600 dark:text-purple-400">❖</span> Llave de Competencia
                        </h3>
                        <div className="flex gap-3">
                            {category.pyramidMatches.some(m => !m.isReady) && !skipPoomsaeConfig && (
                                <>
                                    <button 
                                        onClick={() => updateCategory({ ...category, pyramidMatches: [] })}
                                        className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                        title="Eliminar la llave actual para volver a configurar competidores"
                                    >
                                        Reiniciar Sorteo
                                    </button>
                                    <button 
                                        onClick={handleGeneratePyramidBrackets}
                                        className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                        title="Sortear de nuevo. RECUERDE: Los 2 primeros competidores de la lista se mantendrán como SIEMBRAS en los extremos."
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        Sortear de Nuevo
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={() => setIsPdfModalOpen(true)}
                                className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                Imprimir PDF Gráfico
                            </button>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl shadow-inner border border-slate-200 dark:border-white/5 overflow-hidden backdrop-blur-sm">
                        <PyramidBracket 
                            matches={category.pyramidMatches} 
                            isEditable={true} 
                            onMatchUpdate={handleBracketUpdate} 
                            onResetMatch={handleResetMatch}
                        />
                    </div>
                </div>
            ) : (
                 <button onClick={handleGeneratePyramidBrackets} disabled={competitors.length < 2} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all mb-8 disabled:opacity-50 disabled:cursor-not-allowed">
                    Generar Llave Automática (Usando Orden Actual)
                 </button>
            )}
             <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl shadow-xl mb-8 border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
                    <h3 className="font-bold text-orange-600 dark:text-orange-400 tracking-wide uppercase text-sm">Configuración de Encuentro Manual</h3>
                    <div className="flex space-x-3">
                        <button onClick={handleLoadWinners} className="bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 py-2 px-4 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-500/30 transition-colors disabled:opacity-30" disabled={category.pyramidMatches.filter(m => m.winner).length === 0}>
                            Cargar Ganadores
                        </button>
                        {entryMode === 'manual' && (
                            <button onClick={() => setEntryMode('dropdown')} className="bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 py-2 px-4 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors disabled:opacity-30" disabled={competitors.length === 0 && availableWinners.length === 0}>
                                Seleccionar de Lista
                            </button>
                        )}
                        {entryMode === 'dropdown' && ( <button onClick={() => setEntryMode('manual')} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 py-2 px-4 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                Entrada Manual
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fase de la Llave</label>
                        <select value={phase} onChange={e => setPhase(e.target.value)} className={selectStyles}>
                             {PHASE_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                     <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Número de Encuentro</label>
                        <input 
                            type="number" 
                            value={matchNumber} 
                            onChange={e => handleMatchNumberChange(parseInt(e.target.value || '0'))} 
                            min="1" 
                            className={inputStyles} 
                        />
                         <p className="text-xs text-slate-500 mt-1 italic">
                            * Digite el número para cargar un encuentro existente.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-500/30 relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h4 className="font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest text-xs mb-4">Competidor Azul</h4>
                        {entryMode === 'dropdown' ? (
                            <select 
                                value={competitorListForDropdown.some(c => c.id === competitorBlue.id) ? competitorBlue.id : ''} 
                                onChange={e => handleCompetitorSelection('blue', e.target.value)} 
                                className={selectStyles}
                            >
                                <option value="" disabled>Seleccione un competidor...</option>
                                {blueDropdownOptions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.delegation})</option>)}
                            </select>
                        ) : (
                            <div className="space-y-3">
                                <input type="text" placeholder="Nombre" value={competitorBlue.name} onChange={e => setCompetitorBlue({...competitorBlue, name: e.target.value})} required={!byeWinner} className={inputStyles} />
                                <input type="text" placeholder="Delegación" value={competitorBlue.delegation} onChange={e => setCompetitorBlue({...competitorBlue, delegation: e.target.value})} className={inputStyles} />
                            </div>
                        )}
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-500/30 relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
                        <h4 className="font-black text-red-800 dark:text-red-400 uppercase tracking-widest text-xs mb-4 text-right">Competidor Rojo</h4>
                        {entryMode === 'dropdown' ? (
                            <select 
                                value={competitorListForDropdown.some(c => c.id === competitorRed.id) ? competitorRed.id : ''} 
                                onChange={e => handleCompetitorSelection('red', e.target.value)} 
                                className={selectStyles}
                            >
                                <option value="" disabled>Seleccione un competidor...</option>
                                {redDropdownOptions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.delegation})</option>)}
                            </select>
                        ) : (
                            <div className="space-y-3">
                                <input type="text" placeholder="Nombre" value={competitorRed.name} onChange={e => setCompetitorRed({...competitorRed, name: e.target.value})} required={!byeWinner} className={inputStyles} />
                                <input type="text" placeholder="Delegación" value={competitorRed.delegation} onChange={e => setCompetitorRed({...competitorRed, delegation: e.target.value})} className={inputStyles} />
                            </div>
                        )}
                    </div>
                </div>
                 <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 text-center">
                    <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">Opciones de Victoria Automática (BYE)</p>
                    <div className="flex justify-center space-x-4">
                        <button type="button" onClick={() => setByeWinner('blue')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${byeWinner === 'blue' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white border border-gray-300 dark:border-white/10'}`}>Gana Azul</button>
                        <button type="button" onClick={() => setByeWinner('red')} className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${byeWinner === 'red' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-red-600 dark:hover:text-white border border-gray-300 dark:border-white/10'}`}>Gana Rojo</button>
                        {byeWinner && <button type="button" onClick={() => setByeWinner(null)} className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600 text-sm">Limpiar Selección</button>}
                    </div>
                </div>
            </div>
            </>
        )}

        <div className="flex justify-between pt-8 border-t border-white/10">
            <button onClick={() => setScreen('CATEGORY')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              <span>Volver a Categorías</span>
            </button>
            
            {isFreestyle ? (
                <button onClick={handleStartFreestyleCompetition} className="bg-emerald-500 text-white py-3 px-8 rounded-xl font-bold shadow-lg hover:shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:-translate-y-1">
                  Iniciar Presentación Freestyle
                </button>
            ) : category.system === CompetitionSystem.Rounds ? (
                <button onClick={handleStartRoundsCompetition} className="bg-emerald-500 text-white py-3 px-8 rounded-xl font-bold shadow-lg hover:shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:-translate-y-1">
                  {category.round === 'final' ? 'Iniciar Ronda Final' : 'Iniciar Competencia'}
                </button>
            ) : category.system === CompetitionSystem.Pyramid && (
                byeWinner ? (
                    <button onClick={handleSaveByeMatch} className="bg-amber-500 text-white py-3 px-8 rounded-xl font-bold shadow-lg hover:shadow-amber-500/30 hover:bg-amber-600 transition-all transform hover:-translate-y-1">
                      Guardar Ronda (BYE)
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button onClick={() => handleStartPyramidMatch()} className="bg-slate-700 text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:bg-slate-600 transition-all transform hover:-translate-y-1 tracking-wide border border-white/10">
                            Iniciar Manual
                        </button>
                        <button onClick={handleStartPyramidAuto} className="bg-emerald-500 text-white py-3 px-10 rounded-xl font-bold shadow-lg hover:shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:-translate-y-1 tracking-wide flex items-center gap-2">
                            <span>Empezar Pirámide Automático</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                )
            )}
        </div>
      </main>

      {/* Paste from Spreadsheet Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-lg">
                <h3 className="text-2xl font-bold text-white mb-2">Pegar Competidores</h3>
                <p className="text-slate-400 mb-6 text-sm">Copie las columnas (nombre y delegación) desde su hoja de cálculo.</p>
                <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full h-48 p-4 border border-slate-700 rounded-xl text-white bg-slate-950/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all custom-scrollbar"
                    placeholder="Ejemplo:&#10;Juan Pérez	Delegación A&#10;Ana Gómez	Delegación B"
                />
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={() => setIsPasteModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleProcessPaste} className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                        Procesar Datos
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bracket PDF Export Modal */}
      <BracketPdfExportModal
        isOpen={isPdfModalOpen}
        event={event}
        category={category}
        pyramidMatches={category.pyramidMatches || []}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
};
