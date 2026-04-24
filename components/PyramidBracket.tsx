import React, { useState } from 'react';
import { PyramidMatch, Competitor } from '../types';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface PyramidBracketProps {
  matches: PyramidMatch[];
  isEditable?: boolean;
  onMatchUpdate?: (matches: PyramidMatch[]) => void;
  onResetMatch?: (matchId: string) => void;
}

interface DraggableCompetitorProps {
    competitor: Competitor;
    matchId: string;
    slot: 'blue' | 'red';
    isEditable: boolean;
    isWinner?: boolean;
}

const DraggableCompetitor: React.FC<DraggableCompetitorProps> = ({ competitor, matchId, slot, isEditable, isWinner }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `${matchId}-${slot}`,
        data: { matchId, slot, competitor },
        disabled: !isEditable || competitor.name === 'BYE' || competitor.name === '---',
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 999 : 'auto',
    };

    // Kinetic Arena Style
    const isBYE = competitor.name === 'BYE' || competitor.name === '---';
    
    let baseClasses = "flex items-center gap-3 p-3 rounded-full border transition-all relative overflow-hidden ";
    
    if (slot === 'blue') {
        baseClasses += isWinner 
            ? "bg-blue-600 text-white border-blue-400 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] z-10 scale-[1.02]" 
            : (competitor.hasWarning ? "bg-amber-100 text-slate-700 border-amber-300 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50");
    } else {
        baseClasses += isWinner 
            ? "bg-red-600 text-white border-red-400 shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)] z-10 scale-[1.02]" 
            : (competitor.hasWarning ? "bg-amber-100 text-slate-700 border-amber-300 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-100 hover:border-red-200 hover:bg-red-50/50");
    }

    if (isBYE) baseClasses += " opacity-40 grayscale";
    if (isDragging) baseClasses += " opacity-0";

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            className={`${baseClasses} ${isEditable && !isWinner && !isBYE ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            {/* Avatar Circle */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black border-2 ${isWinner ? 'bg-white/20 border-white/40' : (competitor.hasWarning ? 'bg-amber-200 border-amber-400 text-amber-700' : 'bg-slate-200 border-white text-slate-400')}`}>
                {competitor.hasWarning ? '!' : (competitor.name ? competitor.name.charAt(0) : '?')}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-tight leading-none mb-1">
                    {competitor.name || '---'}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>
                    {competitor.delegation || 'SIN CLUB'}
                </p>
            </div>

            {competitor.hasWarning && !isWinner && (
                <div className="text-amber-600 ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            )}

            {isWinner && (
                <div className="absolute right-3">
                    <span className="text-[8px] font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full">WIN</span>
                </div>
            )}
        </div>
    );
};

interface DroppableSlotProps {
    matchId: string;
    slot: 'blue' | 'red';
    children: React.ReactNode;
}

const DroppableSlot: React.FC<DroppableSlotProps> = ({ matchId, slot, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `${matchId}-${slot}-drop`,
        data: { matchId, slot },
    });

    return (
        <div ref={setNodeRef} className={`rounded-full transition-all duration-300 ${isOver ? 'ring-4 ring-primary/20 scale-[1.05]' : ''}`}>
            {children}
        </div>
    );
};

export const PyramidBracket: React.FC<PyramidBracketProps> = ({ matches, isEditable = false, onMatchUpdate }) => {
    const phases = ['Final', 'Semifinal', 'Cuartos de Final', 'Octavos de Final', '16avos de Final', '32avos de Final'];
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeCompetitor, setActiveCompetitor] = useState<Competitor | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // Group matches by phase
    const matchesByPhase = phases.reduce((acc, phase) => {
        const phaseMatches = matches.filter(m => m.phase === phase);
        if (phaseMatches.length > 0) {
            acc[phase] = phaseMatches;
        }
        return acc;
    }, {} as Record<string, PyramidMatch[]>);

    const phaseOrder = [...phases].reverse().filter(p => matchesByPhase[p]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveCompetitor(active.data.current?.competitor);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveCompetitor(null);

        if (!over || !onMatchUpdate) return;

        const sourceData = active.data.current as { matchId: string; slot: 'blue' | 'red'; competitor: Competitor };
        const targetData = over.data.current as { matchId: string; slot: 'blue' | 'red' };

        if (!sourceData || !targetData) return;
        if (sourceData.matchId === targetData.matchId && sourceData.slot === targetData.slot) return;

        const newMatches = [...matches];
        const sourceMatchIndex = newMatches.findIndex(m => m.id === sourceData.matchId);
        const targetMatchIndex = newMatches.findIndex(m => m.id === targetData.matchId);

        if (sourceMatchIndex === -1 || targetMatchIndex === -1) return;

        const sourceMatch = { ...newMatches[sourceMatchIndex] };
        const targetMatch = { ...newMatches[targetMatchIndex] };

        const getCompetitor = (m: PyramidMatch, s: 'blue' | 'red') => s === 'blue' ? m.competitorBlue : m.competitorRed;
        
        const sourceComp = getCompetitor(sourceMatch, sourceData.slot);
        const targetComp = getCompetitor(targetMatch, targetData.slot);

        if (sourceData.slot === 'blue') sourceMatch.competitorBlue = targetComp;
        else sourceMatch.competitorRed = targetComp;

        if (targetData.slot === 'blue') targetMatch.competitorBlue = sourceComp;
        else targetMatch.competitorRed = sourceComp;

        newMatches[sourceMatchIndex] = sourceMatch;
        newMatches[targetMatchIndex] = targetMatch;

        onMatchUpdate(newMatches);
    };

    const MatchCard: React.FC<{ match: PyramidMatch; isLastInPhase: boolean }> = ({ match, isLastInPhase }) => {
        const blueWinner = match.winner === 'blue';
        const redWinner = match.winner === 'red';

        return (
            <div className="relative w-64 flex-shrink-0 py-6">
                <div className="flex justify-between items-center mb-2 px-4">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {match.byeWinner ? 'BYE (Pase Directo)' : `Match #${match.matchNumber || '?'}`}
                    </span>
                    {match.isReady && !match.winner && !match.byeWinner && (
                        <div className="flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             <span className="text-[8px] font-bold text-emerald-600 uppercase">Listo</span>
                        </div>
                    )}
                    {isEditable && match.winner && !match.byeWinner && (
                        <button 
                            onClick={() => {
                                const pin = window.prompt("Ingrese PIN de corrección (0913):");
                                if (pin === "0913") {
                                    if (onMatchUpdate) {
                                        // The actual logic will be handled by the parent or via a new helper
                                        // But for now, we'll just trigger a callback if provided
                                        // Actually, let's just use onMatchUpdate with the reset logic if we can
                                        // Better: add onResetMatch to the props
                                        if (onResetMatch) {
                                            onResetMatch(match.id);
                                        }
                                    }
                                } else if (pin !== null) {
                                    alert("PIN Incorrecto");
                                }
                            }}
                            className="bg-red-100 hover:bg-red-200 text-red-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter transition-colors"
                            title="Corregir resultado"
                        >
                            Corregir
                        </button>
                    )}
                </div>
                
                <div className="space-y-2 relative z-10">
                    <DroppableSlot matchId={match.id} slot="blue">
                         <DraggableCompetitor 
                            competitor={match.competitorBlue || { id: 'na', name: '---', delegation: '' }} 
                            matchId={match.id} 
                            slot="blue" 
                            isEditable={isEditable && !match.winner} 
                            isWinner={blueWinner}
                        />
                    </DroppableSlot>
                    
                    <div className="flex items-center justify-center -my-1 opacity-20">
                        <span className="text-[8px] font-black text-slate-400 tracking-[0.3em]">VS</span>
                    </div>

                    <DroppableSlot matchId={match.id} slot="red">
                        <DraggableCompetitor 
                            competitor={match.competitorRed || { id: 'na', name: '---', delegation: '' }} 
                            matchId={match.id} 
                            slot="red" 
                            isEditable={isEditable && !match.winner} 
                             isWinner={redWinner}
                        />
                    </DroppableSlot>
                </div>

                {/* Connector Lines */}
                {!isLastInPhase && (
                    <div className="absolute -right-12 top-0 bottom-0 w-12 pointer-events-none">
                        {/* Horizontal branch from match */}
                        <div className="absolute top-1/2 right-6 w-6 h-px bg-slate-300 dark:bg-slate-700"></div>
                        
                        {/* Vertical bridge to meet sibling */}
                        <div className={`absolute right-6 w-px bg-slate-300 dark:bg-slate-700 ${match.matchNumber % 2 === 1 ? 'top-1/2 h-[calc(50%+0.5rem)]' : 'bottom-1/2 h-[calc(50%+0.5rem)]'}`}></div>
                        
                        {/* Final horizontal line to next match */}
                        {match.matchNumber % 2 === 1 && (
                            <div className="absolute top-[calc(100%+0.5rem)] right-0 w-6 h-px bg-slate-300 dark:bg-slate-700"></div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!matches || matches.length === 0) {
        return <div className="text-slate-400 text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 font-bold uppercase tracking-widest text-xs">No hay llaves configuradas</div>;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto pb-12 custom-scrollbar">
                <div className="flex flex-row space-x-12 min-w-max px-8 py-4 items-center">
                    {phaseOrder.map((phase, phaseIdx) => (
                        <div key={phase} className="flex flex-col">
                            <div className="bg-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-center shadow-lg shadow-slate-900/20 sticky top-0 z-20">
                                {phase}
                            </div>
                            <div className="flex flex-col justify-around flex-grow space-y-4">
                                {matchesByPhase[phase]
                                    .sort((a, b) => a.matchNumber - b.matchNumber)
                                    .map(match => (
                                        <MatchCard 
                                            key={match.id} 
                                            match={match} 
                                            isLastInPhase={phaseIdx === phaseOrder.length - 1} 
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <DragOverlay>
                {activeId && activeCompetitor ? (
                     <div className="flex items-center gap-3 p-4 rounded-full shadow-2xl bg-primary text-white w-64 transform scale-105 opacity-95 cursor-grabbing border-2 border-white/50">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black">
                            {activeCompetitor.name?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase">{activeCompetitor.name}</p>
                            <p className="text-[9px] opacity-70 font-bold uppercase">{activeCompetitor.delegation}</p>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
