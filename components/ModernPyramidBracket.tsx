/**
 * components/ModernPyramidBracket.tsx
 * 
 * Modern professional bracket visualization with Kalyo Connect design
 * Material Design 3 theme with live status indicators and energy paths
 */

import React, { useState } from 'react';
import { PyramidMatch, Competitor } from '../types';

interface ModernPyramidBracketProps {
  matches: PyramidMatch[];
  category: {
    title: string;
    competitors: Competitor[];
  };
  onMatchSelect?: (match: PyramidMatch) => void;
  selectedMatchId?: string;
  liveMatchId?: string;
}

export const ModernPyramidBracket: React.FC<ModernPyramidBracketProps> = ({
  matches,
  category,
  onMatchSelect,
  selectedMatchId,
  liveMatchId
}) => {
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);

  // Group matches by phase
  const phases = ['Octavos', 'Cuartos', 'Semifinal', 'Final'];
  const groupedMatches: Record<string, PyramidMatch[]> = {};
  
  phases.forEach(phase => {
    groupedMatches[phase] = matches.filter(m => m.phase === phase).sort((a, b) => a.matchNumber - b.matchNumber);
  });

  const getMatchStatus = (match: PyramidMatch): 'live' | 'completed' | 'pending' | 'bye' => {
    if (!match.competitorBlue || !match.competitorRed) return 'bye';
    if (match.id === liveMatchId) return 'live';
    if (match.winner) return 'completed';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'live': return 'ring-2 ring-vivid-red ring-offset-2 border-vivid-red';
      case 'completed': return 'ring-1 ring-primary/30 border-primary/20';
      case 'pending': return 'ring-1 ring-black/5 border-outline-variant/20';
      default: return 'ring-1 ring-black/5 border-outline-variant/20';
    }
  };

  const getAccentColor = (status: string) => {
    if (status === 'live') return 'text-vivid-red';
    if (status === 'completed') return 'text-primary';
    return 'text-outline';
  };

  return (
    <div className="w-full bg-surface-container-low rounded-3xl p-8 overflow-x-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Live Dynamic Bracket
          </span>
          {liveMatchId && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-vivid-red animate-pulse"></span>
              <span className="text-xs font-semibold text-vivid-red">EN VIVO</span>
            </div>
          )}
        </div>
        <h2 className="text-4xl font-bold text-on-surface mb-1">{category.title}</h2>
        <p className="text-on-surface-variant text-sm">{category.competitors.length} competidores • {matches.length} encuentros</p>
      </div>

      {/* SVG Layer for Connections */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ minHeight: '600px' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2"></stop>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6"></stop>
          </linearGradient>
          <linearGradient id="redGradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"></stop>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6"></stop>
          </linearGradient>
          <filter id="energyGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Bracket Grid */}
      <div className="relative z-10 flex gap-12 min-w-full">
        {phases.map((phase, phaseIdx) => {
          const phaseMatches = groupedMatches[phase];
          if (phaseMatches.length === 0) return null;

          return (
            <div key={phase} className="flex-shrink-0 w-80">
              {/* Phase Header */}
              <div className="text-center mb-6 pb-4 border-b border-outline-variant/30">
                <h3 className="text-xs font-bold text-outline uppercase tracking-[0.15em]">
                  {phaseIdx === 0 && '🎯 Round of 16'}
                  {phaseIdx === 1 && '⚔️ Quarter Finals'}
                  {phaseIdx === 2 && '🏆 Semi Finals'}
                  {phaseIdx === 3 && '👑 Grand Final'}
                </h3>
              </div>

              {/* Matches */}
              <div className="space-y-4">
                {phaseMatches.map((match) => {
                  const status = getMatchStatus(match);
                  const isLive = status === 'live';
                  const isCompleted = status === 'completed';
                  const isBye = status === 'bye';

                  if (isBye) {
                    return (
                      <div key={match.id} className="border-2 border-dashed border-outline-variant rounded-2xl p-4 flex flex-col items-center justify-center bg-surface-container-low/50 min-h-[140px]">
                        <span className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Bye</span>
                        <span className="font-bold text-primary text-center">{match.competitorBlue?.name || match.competitorRed?.name}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={match.id}
                      onClick={() => onMatchSelect?.(match)}
                      onMouseEnter={() => setHoveredMatchId(match.id)}
                      onMouseLeave={() => setHoveredMatchId(null)}
                      className={`
                        rounded-2xl p-4 shadow-sm cursor-pointer transition-all duration-300
                        ${getStatusColor(status)}
                        ${isLive ? 'bg-surface-container-lowest shadow-2xl' : 'bg-surface-container-lowest'}
                        ${selectedMatchId === match.id ? 'ring-2 ring-primary shadow-lg' : ''}
                        ${hoveredMatchId === match.id ? 'transform -translate-y-1 shadow-lg' : ''}
                        border-l-4
                        ${isLive ? 'border-l-vivid-red' : isCompleted ? 'border-l-sky-blue' : 'border-l-outline-variant/30'}
                      `}
                    >
                      {/* Match Header */}
                      {isLive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-vivid-red text-white px-2 py-0.5 rounded-lg text-[9px] font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          LIVE
                        </div>
                      )}

                      <div className="text-[9px] font-bold text-outline uppercase tracking-widest mb-3 opacity-70">
                        Encuentro #{match.matchNumber}
                      </div>

                      {/* Competitors */}
                      <div className="space-y-2">
                        {/* Blue Competitor */}
                        <div className={`
                          flex justify-between items-center p-2.5 rounded-lg transition-colors
                          ${isCompleted && match.winner === 'blue' 
                            ? 'bg-sky-blue/15 border-l-2 border-l-sky-blue' 
                            : 'bg-surface-container-low/50'
                          }
                        `}>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-4 h-3 bg-blue-700 rounded-sm flex-shrink-0"></div>
                            <span className={`text-xs font-semibold truncate ${
                              isCompleted && match.winner === 'blue' ? 'text-primary font-black' : 'text-on-surface'
                            }`}>
                              {match.competitorBlue?.name || '(TBD)'}
                            </span>
                          </div>
                          {isCompleted && match.winner === 'blue' && (
                            <span className="text-sky-blue text-xs font-black">✓</span>
                          )}
                        </div>

                        {/* Red Competitor */}
                        <div className={`
                          flex justify-between items-center p-2.5 rounded-lg transition-colors
                          ${isCompleted && match.winner === 'red'
                            ? 'bg-vivid-red/15 border-l-2 border-l-vivid-red'
                            : 'bg-surface-container-low/50'
                          }
                        `}>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-4 h-3 bg-red-600 rounded-sm flex-shrink-0"></div>
                            <span className={`text-xs font-semibold truncate ${
                              isCompleted && match.winner === 'red' ? 'text-vivid-red font-black' : 'text-on-surface'
                            }`}>
                              {match.competitorRed?.name || '(TBD)'}
                            </span>
                          </div>
                          {isCompleted && match.winner === 'red' && (
                            <span className="text-vivid-red text-xs font-black">✓</span>
                          )}
                        </div>
                      </div>

                      {/* Match Status */}
                      {isLive && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/20 text-center">
                          <span className="text-[10px] font-bold text-vivid-red uppercase tracking-widest">En combate</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-8 border-t border-outline-variant/30 flex gap-6 justify-center flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-vivid-red animate-pulse"></div>
          <span className="text-on-surface-variant">En Vivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-blue"></div>
          <span className="text-on-surface-variant">Completado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
          <span className="text-on-surface-variant">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-outline-variant"></div>
          <span className="text-on-surface-variant">Bye (Paso directo)</span>
        </div>
      </div>
    </div>
  );
};
