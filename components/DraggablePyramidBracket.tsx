/**
 * components/DraggablePyramidBracket.tsx
 * 
 * Enhanced pyramid bracket with drag-and-drop match reordering
 * Allows users to reorganize matches before competition starts
 */

import React, { useState } from 'react';
import { PyramidMatch, Competitor } from '../types';

interface DraggablePyramidBracketProps {
  matches: PyramidMatch[];
  onMatchesReorder: (reorderedMatches: PyramidMatch[]) => void;
  onMatchSelect?: (match: PyramidMatch) => void;
  selectedMatchId?: string;
  isEditable?: boolean;
}

interface DragState {
  draggedMatchId: string | null;
  draggedOverMatchId: string | null;
}

export const DraggablePyramidBracket: React.FC<DraggablePyramidBracketProps> = ({
  matches,
  onMatchesReorder,
  onMatchSelect,
  selectedMatchId,
  isEditable = true
}) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedMatchId: null,
    draggedOverMatchId: null
  });

  // Group matches by phase
  const groupedByPhase = groupMatches(matches);
  const phases = ['Octavos', 'Cuartos', 'Semifinal', 'Final'];

  const handleDragStart = (matchId: string) => {
    if (!isEditable) return;
    setDragState({ draggedMatchId: matchId, draggedOverMatchId: null });
  };

  const handleDragOver = (matchId: string) => {
    if (!isEditable) return;
    setDragState(prev => ({ ...prev, draggedOverMatchId: matchId }));
  };

  const handleDrop = (targetMatchId: string) => {
    if (!isEditable || !dragState.draggedMatchId) return;

    const sourceMatch = matches.find(m => m.id === dragState.draggedMatchId);
    const targetMatch = matches.find(m => m.id === targetMatchId);

    if (!sourceMatch || !targetMatch) return;

    // Swap competitor positions between matches
    const newMatches = matches.map(match => {
      if (match.id === sourceMatch.id) {
        return {
          ...match,
          competitorBlue: targetMatch.competitorBlue,
          competitorRed: targetMatch.competitorRed
        };
      }
      if (match.id === targetMatch.id) {
        return {
          ...match,
          competitorBlue: sourceMatch.competitorBlue,
          competitorRed: sourceMatch.competitorRed
        };
      }
      return match;
    });

    onMatchesReorder(newMatches);
    setDragState({ draggedMatchId: null, draggedOverMatchId: null });
  };

  const handleDragLeave = () => {
    setDragState(prev => ({ ...prev, draggedOverMatchId: null }));
  };

  return (
    <div className="w-full space-y-8 p-4">
      {phases.map(phase => {
        const phaseMatches = groupedByPhase[phase] || [];
        if (phaseMatches.length === 0) return null;

        return (
          <div key={phase} className="space-y-3">
            {/* Phase Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg">
              <h3 className="font-bold text-lg">{phase.toUpperCase()}</h3>
              <p className="text-xs opacity-90">{phaseMatches.length} encuentro(s)</p>
            </div>

            {/* Matches Grid */}
            <div className="grid gap-3">
              {phaseMatches.map(match => (
                <DraggableMatchCard
                  key={match.id}
                  match={match}
                  isSelected={selectedMatchId === match.id}
                  isDragging={dragState.draggedMatchId === match.id}
                  isDraggedOver={dragState.draggedOverMatchId === match.id}
                  isEditable={isEditable}
                  onDragStart={() => handleDragStart(match.id)}
                  onDragOver={() => handleDragOver(match.id)}
                  onDrop={() => handleDrop(match.id)}
                  onDragLeave={handleDragLeave}
                  onSelect={() => onMatchSelect?.(match)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {isEditable && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 Tip: Reorganizar Combates
          </p>
          <p className="text-blue-800 dark:text-blue-200">
            Arrastra y suelta combates entre posiciones para reorganizar cómo se abrirá la pírámide.
            Los cambios se guardarán automáticamente.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Individual draggable match card
 */
interface DraggableMatchCardProps {
  match: PyramidMatch;
  isSelected: boolean;
  isDragging: boolean;
  isDraggedOver: boolean;
  isEditable: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragLeave: () => void;
  onSelect: () => void;
}

const DraggableMatchCard: React.FC<DraggableMatchCardProps> = ({
  match,
  isSelected,
  isDragging,
  isDraggedOver,
  isEditable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onSelect
}) => {
  return (
    <div
      draggable={isEditable}
      onDragStart={onDragStart}
      onDragOver={e => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={e => {
        e.preventDefault();
        onDrop();
      }}
      onDragLeave={onDragLeave}
      onClick={onSelect}
      className={`
        relative p-4 rounded-lg border-2 transition-all cursor-pointer
        ${isDragging ? 'opacity-50 border-dashed border-gray-400' : ''}
        ${isDraggedOver ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
        ${isSelected ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40' : 'border-gray-200 dark:border-gray-700'}
        ${!isSelected && !isDraggedOver ? 'hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
        dark:bg-gray-800
      `}
    >
      {/* Drag Handle */}
      {isEditable && (
        <div className="absolute top-2 right-2 text-gray-400 cursor-grab active:cursor-grabbing">
          ⋮⋮
        </div>
      )}

      {/* Match Info */}
      <div className="flex gap-4">
        {/* Blue (Chong) */}
        <div className="flex-1">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
            🔵 CHONG (Azul)
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-3 py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              {match.competitorBlue?.name || '(Pendiente)'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {match.competitorBlue?.delegation || 'Sin delegación'}
            </p>
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-600 font-bold text-lg">VS</span>
        </div>

        {/* Red (Hong) */}
        <div className="flex-1">
          <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">
            🔴 HONG (Rojo)
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 rounded px-3 py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              {match.competitorRed?.name || '(Pendiente)'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {match.competitorRed?.delegation || 'Sin delegación'}
            </p>
          </div>
        </div>
      </div>

      {/* Match Number */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Encuentro #{match.matchNumber} • {match.phase}
      </div>
    </div>
  );
};

/**
 * Group matches by tournament phase
 */
function groupMatches(matches: PyramidMatch[]): Record<string, PyramidMatch[]> {
  const grouped: Record<string, PyramidMatch[]> = {
    'Octavos': [],
    'Cuartos': [],
    'Semifinal': [],
    'Final': []
  };

  matches.forEach(match => {
    if (grouped[match.phase]) {
      grouped[match.phase].push(match);
    }
  });

  // Sort each phase by match number
  Object.keys(grouped).forEach(phase => {
    grouped[phase].sort((a, b) => a.matchNumber - b.matchNumber);
  });

  return grouped;
}
