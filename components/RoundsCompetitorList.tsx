import React from 'react';
import { Competitor, CompetitorScore } from '../types';
import { sortCompetitors } from '../src/scoring';

interface RoundsCompetitorListProps {
  competitors: Competitor[];
  scores: CompetitorScore[];
  currentCompetitorId: string;
  numJudges: 3 | 5 | 7;
  poomsaeCount: 1 | 2;
}

export const RoundsCompetitorList: React.FC<RoundsCompetitorListProps> = ({ competitors, scores, currentCompetitorId, numJudges, poomsaeCount }) => {
  const sortedScores = sortCompetitors(scores, competitors, numJudges, poomsaeCount);

  return (
    <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <h4 className="font-bold text-lg mb-4 text-slate-300 relative z-10 border-b border-white/10 pb-2">Ranking en Vivo</h4>
      <ul className="space-y-3 relative z-10 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedScores.map((s, index) => (
          <li key={s.id} className={`p-3 rounded-xl transition-all ${
              s.id === currentCompetitorId 
              ? 'bg-blue-600 shadow-lg scale-[1.02] border border-blue-400/50' 
              : 'bg-slate-700/50 hover:bg-slate-700 border border-white/5'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${s.id === currentCompetitorId ? 'text-white' : 'text-slate-300'}`}>{index + 1}. {s.name}</span>
              <span className={`font-black ${s.id === currentCompetitorId ? 'text-white' : 'text-blue-400'}`}>{(s.finalScore || 0).toFixed(2)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};