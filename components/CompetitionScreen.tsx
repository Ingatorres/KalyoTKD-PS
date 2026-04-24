import React, { useState, useEffect, useCallback } from 'react';
import { Event, Category, Screen, CompetitionSystem, Competitor, CompetitorScore, PyramidMatch, Score } from '../types';
import { Header } from './Header';
import { updatePdi, listenForScores } from '../tauriUtils';
import { sortCompetitors, calculateAverage, calculatePoomsaeFinalScore } from '../src/scoring';
import { RoundsCompetitorList } from './RoundsCompetitorList.tsx';
import { PyramidLiveScoring, PyramidCompetitorPanel } from './PyramidLiveScoring.tsx';
import { FreestyleScoring } from './FreestyleScoring.tsx';
import { ScoreInput } from './ScoreInput';
import { getPyramidMedalWinners } from './PyramidFinalResults.tsx';
import { PyramidBracket } from './PyramidBracket';
import { drawPoomsaes, getPoomsaeList } from '../data/poomsaeData';
import { v4 as uuidv4 } from 'uuid';

interface CompetitionScreenProps {
  event: Event;
  category: Category;
  updateCategory: (category: Category) => void;
  setScreen: (screen: Screen) => void;
  currentMatchId: string | null; // Can be null if not pyramid or no match selected
  setCurrentMatchId: (id: string | null) => void;
}

export const CompetitionScreen: React.FC<CompetitionScreenProps> = ({ event, category, updateCategory, setScreen, currentMatchId, setCurrentMatchId }) => {
  const [scores, setScores] = useState<CompetitorScore[]>(category.scores || []);
  const [currentCompetitorIndex, setCurrentCompetitorIndex] = useState(0);
  const [currentPoomsaeIndex, setCurrentPoomsaeIndex] = useState(0);
  const [history, setHistory] = useState<CompetitorScore[][]>([]);
  const [showBracketModal, setShowBracketModal] = useState(false);

  // State for Pyramid system
  const [currentMatch, setCurrentMatch] = useState<PyramidMatch | null>(null);
  const [isTieBreak, setIsTieBreak] = useState(false);
  const [isTieBreakAnnouncing, setIsTieBreakAnnouncing] = useState(false);
  const [pyramidPoomsaeIndex, setPyramidPoomsaeIndex] = useState(0); // 0 for P1, 1 for P2
  
  // State for Rounds system flow
  const [qualificationStep, setQualificationStep] = useState<'scoring' | 'show_finalists' | 'final_ready'>('scoring');


  const numJudges = event.judges.length as 3 | 5 | 7;

  // --- WebSocket Score Listener ---
  useEffect(() => {
    const unlisten = listenForScores((scoreData) => {
      const { judgeIndex, technical, presentation } = scoreData;
      const currentCompetitor = category.competitors[currentCompetitorIndex];
      if (!currentCompetitor) return;

      // Update technical and presentation scores for the current competitor and poomsae
      handleScoreChange(currentCompetitor.id, currentPoomsaeIndex, judgeIndex, 'technical', technical);
      handleScoreChange(currentCompetitor.id, currentPoomsaeIndex, judgeIndex, 'presentation', presentation);
    });

    return () => { unlisten.then(f => f()); };
  }, [currentCompetitorIndex, currentPoomsaeIndex, category.competitors]);

  // --- Effects ---
  useEffect(() => {
    // Find the current match for Pyramid system
    if (category.system === CompetitionSystem.Pyramid) {
      const match = category.pyramidMatches?.find(m => m.id === currentMatchId) || null;
      setCurrentMatch(match);
      // Note: We don't reset pyramidPoomsaeIndex here to avoid loops, it's handled when changing matches
      
      if (match) {
        const p1ScoreBlue = calculatePoomsaeFinalScore(match.scoreBlueP1, numJudges);
        const p2ScoreBlue = calculatePoomsaeFinalScore(match.scoreBlueP2, numJudges);
        const p1ScoreRed = calculatePoomsaeFinalScore(match.scoreRedP1, numJudges);
        const p2ScoreRed = calculatePoomsaeFinalScore(match.scoreRedP2, numJudges);

        // Use the explicit state to determine which scores to show
        const currentScoresBlue = (pyramidPoomsaeIndex === 1 ? match.scoreBlueP2 : match.scoreBlueP1) || { technical: [], presentation: [] };
        const currentScoresRed = (pyramidPoomsaeIndex === 1 ? match.scoreRedP2 : match.scoreRedP1) || { technical: [], presentation: [] };
        
        // Calculate final score based on configuration
        const finalScoreBlue = category.poomsaeConfig.count === 2 && p1ScoreBlue > 0 && p2ScoreBlue > 0 
            ? (p1ScoreBlue + p2ScoreBlue) / 2 
            : (p1ScoreBlue || p2ScoreBlue);
            
        const finalScoreRed = category.poomsaeConfig.count === 2 && p1ScoreRed > 0 && p2ScoreRed > 0 
            ? (p1ScoreRed + p2ScoreRed) / 2 
            : (p1ScoreRed || p2ScoreRed);

        const techAvgBlue = calculateAverage(currentScoresBlue.technical, numJudges);
        const presAvgBlue = calculateAverage(currentScoresBlue.presentation, numJudges);
        const techAvgRed = calculateAverage(currentScoresRed.technical, numJudges);
        const presAvgRed = calculateAverage(currentScoresRed.presentation, numJudges);

        const poomsaeName = category.poomsaeConfig.poomsaes[pyramidPoomsaeIndex] || `Poomsae ${pyramidPoomsaeIndex + 1}`;
        const poomsaeInfoText = `Poomsae ${pyramidPoomsaeIndex + 1} de ${category.poomsaeConfig.count}${poomsaeName ? `: ${poomsaeName}` : ''}`;

        // Only update PDI with live scores if:
        // 1. There is no winner yet.
        // 2. We are NOT in a tie-break announcement protocol.
        // 3. We are NOT in a tie-break OR we have already started scoring the tie-break.
        const hasScoresInCurrent = currentScoresBlue.technical.some(s => s !== null) || 
                                   currentScoresRed.technical.some(s => s !== null);

        if (!match.winner && !isTieBreakAnnouncing && (!isTieBreak || hasScoresInCurrent)) {
            updatePdi({
              view: 'PYRAMID_LIVE',
              data: {
                categoryTitle: category.title,
                phase: match.phase,
                matchNumber: match.matchNumber,
                poomsaeInfo: poomsaeInfoText,
                competitorBlue: {
                  name: match.competitorBlue?.name || '---',
                  delegation: match.competitorBlue?.delegation || '---',
                  score: finalScoreBlue,
                  p1Score: p1ScoreBlue,
                  p2Score: p2ScoreBlue,
                  techAvg: techAvgBlue,
                  presAvg: presAvgBlue,
                  rawScores: currentScoresBlue,
                  poomsaeNameToPerform: poomsaeName,
                },
                competitorRed: {
                  name: match.competitorRed?.name || '---',
                  delegation: match.competitorRed?.delegation || '---',
                  score: finalScoreRed,
                  p1Score: p1ScoreRed,
                  p2Score: p2ScoreRed,
                  techAvg: techAvgRed,
                  presAvg: presAvgRed,
                  rawScores: currentScoresRed,
                  poomsaeNameToPerform: poomsaeName,
                },
                modality: category.division,
              }
            });
        }
      }
    }
  }, [category.system, category.pyramidMatches, currentMatchId, scores, pyramidPoomsaeIndex, isTieBreak, isTieBreakAnnouncing]);

  useEffect(() => {
    // PDI update for Rounds system
    if (category.system === CompetitionSystem.Rounds && category.competitors.length > 0 && qualificationStep !== 'show_finalists' && category.status !== 'completed') {
      const poomsaeCount = category.poomsaeConfig.count;
      const currentCompetitor = category.competitors[currentCompetitorIndex];
      const currentScore = scores.find(s => s.competitorId === currentCompetitor.id);
      const sortedScores = sortCompetitors(scores, category.competitors, numJudges, poomsaeCount);

      const currentPoomsaeScores = currentPoomsaeIndex === 0 ? currentScore?.poomsae1 : currentScore?.poomsae2;
      const finalScoreForCurrentPoomsae = currentPoomsaeScores ? calculatePoomsaeFinalScore(currentPoomsaeScores, numJudges) : 0;
      
      const poomsaeName = category.poomsaeConfig.poomsaes[currentPoomsaeIndex];
      const poomsaeInfoText = poomsaeCount === 1 
        ? `Poomsae Único${poomsaeName ? `: ${poomsaeName}` : ''}`
        : `Poomsae ${currentPoomsaeIndex + 1} de ${poomsaeCount}${poomsaeName ? `: ${poomsaeName}` : ''}`;

      const liveScoresPayload: any = {
        technicalAvg: currentPoomsaeScores ? calculateAverage(currentPoomsaeScores.technical, numJudges) : 0,
        presentationAvg: currentPoomsaeScores ? calculateAverage(currentPoomsaeScores.presentation, numJudges) : 0,
        finalScore: finalScoreForCurrentPoomsae,
      };

      if (poomsaeCount === 2) {
        liveScoresPayload.p1Score = currentScore?.poomsae1 ? calculatePoomsaeFinalScore(currentScore.poomsae1, numJudges) : undefined;
        liveScoresPayload.p2Score = currentScore?.poomsae2 ? calculatePoomsaeFinalScore(currentScore.poomsae2, numJudges) : undefined;
        liveScoresPayload.p1TechAvg = currentScore?.poomsae1 ? calculateAverage(currentScore.poomsae1.technical, numJudges) : undefined;
        liveScoresPayload.p1PresAvg = currentScore?.poomsae1 ? calculateAverage(currentScore.poomsae1.presentation, numJudges) : undefined;
        liveScoresPayload.p2TechAvg = currentScore?.poomsae2 ? calculateAverage(currentScore.poomsae2.technical, numJudges) : undefined;
        liveScoresPayload.p2PresAvg = currentScore?.poomsae2 ? calculateAverage(currentScore.poomsae2.presentation, numJudges) : undefined;
      }

      updatePdi({
        view: 'ROUNDS_LIVE',
        data: {
          categoryTitle: category.title,
          currentCompetitor: currentCompetitor,
          poomsaeCount: poomsaeCount, // Pass poomsaeCount
          poomsaeInfo: poomsaeInfoText,
          liveScores: liveScoresPayload,
          allScores: sortedScores,
        }
      });
    }
  }, [currentCompetitorIndex, currentPoomsaeIndex, scores, category, event.judges, numJudges, qualificationStep]);


  // --- Handlers ---

  const handleScoreChange = (competitorId: string, poomsaeIndex: number, judgeIndex: number, scoreType: 'technical' | 'presentation', value: number | null) => {
    setScores(prevScores => {
        const newScores = [...prevScores];
        let competitorScore = newScores.find(s => s.competitorId === competitorId);

        if (!competitorScore) {
            competitorScore = { competitorId, poomsae1: { technical: [], presentation: [] }, poomsae2: { technical: [], presentation: [] } };
            newScores.push(competitorScore);
        }

        const poomsaeKey = poomsaeIndex === 0 ? 'poomsae1' : 'poomsae2';
        if (!competitorScore[poomsaeKey]) {
            competitorScore[poomsaeKey] = { technical: Array(numJudges).fill(null), presentation: Array(numJudges).fill(null) };
        }

        const scoreField = competitorScore[poomsaeKey]!;
        if (!scoreField[scoreType]) {
            scoreField[scoreType] = Array(numJudges).fill(null);
        }

        scoreField[scoreType][judgeIndex] = isNaN(value as number) ? 0 : value;

        return newScores;
    });
  };

  const handlePyramidScoreChange = (competitorId: string, poomsaeIndex: number, judgeIndex: number, scoreType: 'technical' | 'presentation', value: number | null) => {
    if (!currentMatch) return;

    const updatedMatches = category.pyramidMatches.map(m => {
        if (m.id !== currentMatch.id) return m;

        const isBlue = m.competitorBlue?.id === competitorId;
        const scoreKey = isBlue ? (poomsaeIndex === 0 ? 'scoreBlueP1' : 'scoreBlueP2') : (poomsaeIndex === 0 ? 'scoreRedP1' : 'scoreRedP2');
        
        const newScore: Score = m[scoreKey] ? { ...m[scoreKey]! } : { technical: Array(numJudges).fill(null), presentation: Array(numJudges).fill(null) };
        newScore[scoreType][judgeIndex] = isNaN(value as number) ? 0 : value;

        return { ...m, [scoreKey]: newScore };
    });

    updateCategory({
        ...category,
        pyramidMatches: updatedMatches,
    });
  };

  const handleSaveAndNext = () => {
    setHistory(prev => [...prev, scores]); // Save current state for undo

    const isLastPoomsae = currentPoomsaeIndex === category.poomsaeConfig.count - 1;
    const isLastCompetitor = currentCompetitorIndex === category.competitors.length - 1;

    if (!isLastPoomsae) {
      // Move to next poomsae for the same competitor
      setCurrentPoomsaeIndex(currentPoomsaeIndex + 1);
    } else if (!isLastCompetitor) {
      // Move to the first poomsae of the next competitor
      setCurrentPoomsaeIndex(0);
      setCurrentCompetitorIndex(currentCompetitorIndex + 1);
    } else {
      // This is the last competitor and last poomsae, do nothing (finish button will be shown)
    }
  };

  const handleShowFinalistsOrder = () => {
    const sortedScores = sortCompetitors(scores, category.competitors, numJudges, category.poomsaeConfig.count);
    
    // Check for a tie at the 8th position
    if (sortedScores.length > 8) {
        const score8 = sortedScores[7];
        const score9 = sortedScores[8];
        if (score8.finalScore === score9.finalScore && score8.presAvg === score9.presAvg) {
            // Tie detected
            const tieBreakCompetitors = sortedScores.filter(s => s.finalScore === score8.finalScore && s.presAvg === score8.presAvg);
            const tieBreakIds = tieBreakCompetitors.map(c => c.id);
            
            const updatedCategory = { 
                ...category, 
                status: 'tiebreak' as const,
                round: 'tiebreak' as const,
                tieBreakCompetitorIds: tieBreakIds,
            };
            updateCategory(updatedCategory);
            
            alert("Empate técnico detectado para el 8º puesto. Configure el Poomsae de desempate.");
            setScreen('POOMSAE_CONFIG');
            return;
        }
    }

    const qualified = sortedScores.slice(0, 8);
    const qualifiedIds = qualified.map(c => c.id);
    const finalCategory = { 
        ...category, 
        qualifiedCompetitorIds: qualifiedIds,
    };
    updateCategory(finalCategory);

    const finalRoundOrder = qualified.sort((a, b) => a.finalScore - b.finalScore);
    
    updatePdi({
        view: 'ROUNDS_FINALISTS',
        data: {
            categoryTitle: category.title,
            finalists: finalRoundOrder.map(f => ({
                name: f.name,
                delegation: f.delegation,
                finalScore: f.finalScore,
            })),
            poomsaeInfo: category.poomsaeConfig.poomsaes.filter(p => p).join(' y ') || 'Poomsae no definido',
        }
    });

    setQualificationStep('show_finalists');
  };

  const handleStartFinalRound = () => {
    const qualifiedCompetitors = category.competitors.filter(c => category.qualifiedCompetitorIds?.includes(c.id));
    const finalScores = sortCompetitors(scores, qualifiedCompetitors, numJudges, category.poomsaeConfig.count);
    const finalRoundCompetitors = finalScores.sort((a, b) => a.finalScore - b.finalScore).map(s => category.competitors.find(c => c.id === s.id)!);

    const finalCategory = {
        ...category,
        round: 'final' as const,
        competitors: finalRoundCompetitors,
        scores: [], // Reset scores for the final round
    };
    updateCategory(finalCategory);

    // Redirect to Poomsae Config for the draw
    setScreen('POOMSAE_CONFIG');
  };

  const handleShowPodium = () => {
    const finalScores = sortCompetitors(scores, category.competitors, numJudges, category.poomsaeConfig.count);
    const finalCategory = { ...category, status: 'completed' as const, scores };
    updateCategory(finalCategory);
    updatePdi({ view: 'ROUNDS_FINAL_RESULTS', data: { categoryTitle: category.title, displayScores: finalScores } });
    // The user will click "Volver a Categorías" manually.
  };

    const [showContinueButton, setShowContinueButton] = useState(false);

    // Reset continue button state when match changes
    useEffect(() => {
        setShowContinueButton(false);
    }, [currentMatchId]);

  const handleDeclareWinner = (winner: 'blue' | 'red' | 'tie') => {
    if (!currentMatch) return;

    if (winner === 'tie') {
        setIsTieBreak(true);
        setIsTieBreakAnnouncing(true);
        
        // --- Technical Tie Protocol ---
        // 1. Show technical tie screen on PDI
        updatePdi({
            view: 'TECHNICAL_TIE',
            data: {
                categoryTitle: category.title,
                position: 0, // Not used for pyramid but required by type
                competitors: [currentMatch.competitorBlue!, currentMatch.competitorRed!]
            }
        });

        // 2. Perform a NEW draw for the tie-break poomsae
        const usedPoomsaes = category.poomsaeConfig.poomsaes.filter(Boolean);
        const options = getPoomsaeList(category);
        const newDraw = drawPoomsaes(1, options, usedPoomsaes);

        // 3. Update category with the new draw for the PDI draw screen
        setTimeout(() => {
            updatePdi({
                view: 'POOMSAE_DRAW',
                data: {
                    categoryTitle: `${category.title} - DESEMPATE`,
                    poomsaes: newDraw
                }
            });

            setPyramidPoomsaeIndex(1);
            
            // Allow scoring to resume after another short delay or when registrar starts
            setTimeout(() => {
                setIsTieBreakAnnouncing(false);
            }, 10000); // Give 10s to see the draw

            alert(`¡EMPATE TÉCNICO! Se ha sorteado una nueva forma: ${newDraw[0]}. Por favor, inicien el desempate.`);
        }, 5000);

        return;
    }

    const updatedMatch = { ...currentMatch, winner, isReady: true };
    const winnerCompetitor = winner === 'blue' ? currentMatch.competitorBlue : currentMatch.competitorRed;

    // PDI Update for winner
    if (winnerCompetitor) {
        const score1 = winner === 'blue' ? currentMatch.scoreBlueP1 : currentMatch.scoreRedP1;
        const score2 = winner === 'blue' ? currentMatch.scoreBlueP2 : currentMatch.scoreRedP2;

        const p1Score = calculatePoomsaeFinalScore(score1, numJudges);
        const p2Score = calculatePoomsaeFinalScore(score2, numJudges);

        const finalScore = category.poomsaeConfig.count === 2 && p1Score > 0 && p2Score > 0
            ? (p1Score + p2Score) / 2
            : (p1Score || p2Score);

        const currentScores = (pyramidPoomsaeIndex === 1 ? score2 : score1) || { technical: [], presentation: [] };
        const techAvg = calculateAverage(currentScores.technical, numJudges);
        const presAvg = calculateAverage(currentScores.presentation, numJudges);

        updatePdi({
            view: 'PYRAMID_WINNER',
            data: { 
                winner: winner, 
                competitorName: winnerCompetitor.name,
                competitorDelegation: winnerCompetitor.delegation,
                finalScore,
                techAvg,
                presAvg,
                modality: category.division
            }
        });
    }

    let nextCategoryStatus = category.status;
    if (currentMatch.phase === 'Final') {
        nextCategoryStatus = 'completed';
    }

    // Propagation logic: Update the parent match AND the next match in one go
    const updatedMatches = category.pyramidMatches.map(m => {
        // 1. Update the current match
        if (m.id === currentMatch.id) {
            return updatedMatch;
        }
        
        // 2. Update the successor match if this match was its parent
        if (updatedMatch.nextMatchId && m.id === updatedMatch.nextMatchId) {
            const targetSlot = updatedMatch.winnerTargetSlot === 'blue' ? 'competitorBlue' : 'competitorRed';
            const newMatch = { ...m, [targetSlot]: winnerCompetitor };
            // Auto-ready if both slots filled
            if (newMatch.competitorBlue && newMatch.competitorRed) {
                newMatch.isReady = true;
            }
            return newMatch;
        }
        return m;
    });

    const updatedCategory = {
        ...category,
        pyramidMatches: updatedMatches,
        status: nextCategoryStatus,
    };
    updateCategory(updatedCategory);

    // Protocol delay for PDI winner screen
    setTimeout(() => {
        if (nextCategoryStatus === 'completed') {
            const medalWinners = getPyramidMedalWinners(updatedMatches);
            updatePdi({
                view: 'PYRAMID_FINAL_RESULTS',
                data: {
                    categoryTitle: category.title,
                    winners: medalWinners,
                    modality: category.modality
                }
            });
        }
        setShowContinueButton(true);
    }, 8000); // Slightly reduced to 8s for better flow
  };

  const handleContinueCategory = () => {
    if (!currentMatch) return;
    
    // Look for the next match in chronological order that is READY and NOT finished
    const matches = category.pyramidMatches || [];
    const nextMatches = matches
        .filter(m => m.matchNumber > currentMatch.matchNumber)
        .sort((a, b) => a.matchNumber - b.matchNumber);
    
    const nextReadyMatch = nextMatches.find(m => m.isReady && !m.winner);

    if (nextReadyMatch) {
        // Reset local pyramid states for the new match
        setPyramidPoomsaeIndex(0);
        setIsTieBreak(false);
        setCurrentMatchId(nextReadyMatch.id);
    } else {
        // No more ready matches (either end of list or waiting for other branches)
        // Check if there are ANY unfinished matches left
        const hasUnfinished = matches.some(m => !m.winner && !m.vaiWinner);
        if (!hasUnfinished || category.status === 'completed') {
            setScreen('POOMSAE_CONFIG'); // Tournament or Phase finished
        } else {
            alert("No hay más encuentros listos por ahora. Regresando a la llave para verificar resultados.");
            setScreen('POOMSAE_CONFIG');
        }
    }
  };



  const handleUndo = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setScores(lastState);
      setHistory(history.slice(0, -1));
    }
  };

  const handleFinalizeCategory = () => {
    const confirmed = window.confirm("¿Está seguro de que desea finalizar esta categoría? Esta acción no se puede deshacer.");
    if (confirmed) {
        const finalCategory = { ...category, status: 'completed' as const, scores };
        updateCategory(finalCategory);
        setScreen('RESULTS_VIEWER');
    }
  };

  const getNextButtonText = () => {
    const poomsaeCount = category.poomsaeConfig.count;
    const isLastPoomsae = currentPoomsaeIndex === poomsaeCount - 1;

    if (poomsaeCount === 1) {
        return 'Guardar y Siguiente Competidor';
    }

    if (!isLastPoomsae) {
        return `Guardar P${currentPoomsaeIndex + 1} y Siguiente Poomsae`;
    } else {
        return `Guardar P${currentPoomsaeIndex + 1} y Siguiente Competidor`;
    }
  };

  const renderRoundsControls = () => {
    const isFinalRound = category.round === 'final';
    const isLastCompetitor = currentCompetitorIndex === category.competitors.length - 1;
    const isLastPoomsae = currentPoomsaeIndex === category.poomsaeConfig.count - 1;

    if (isLastCompetitor && isLastPoomsae) {
        if (isFinalRound) {
            return (
                <button onClick={handleShowPodium} className="bg-green-600 text-white py-2 px-6 rounded font-bold text-lg">
                    Ver Podio
                </button>
            );
        } else { // Qualification Round
            if (qualificationStep === 'scoring') {
                return (
                    <button onClick={handleShowFinalistsOrder} className="bg-blue-600 text-white py-2 px-4 rounded font-bold">
                        Enseñar Orden de Finalistas
                    </button>
                );
            } else if (qualificationStep === 'show_finalists') {
                return (
                    <button onClick={handleStartFinalRound} className="bg-purple-600 text-white py-2 px-4 rounded font-bold">
                        Pasar a Ronda Final
                    </button>
                );
            }
        }
    }
    
    return (
        <button onClick={handleSaveAndNext} className="bg-indigo-600 text-white py-2 px-4 rounded">
            {getNextButtonText()}
        </button>
    );
  };

  const RoundsScoringPanel: React.FC<{ competitorId: string; poomsaeIndex: number; }> = ({ competitorId, poomsaeIndex }) => {
    const competitorScore = scores.find(s => s.competitorId === competitorId);
    const poomsaeKey = poomsaeIndex === 0 ? 'poomsae1' : 'poomsae2';
    const poomsaeScores = competitorScore?.[poomsaeKey];

    const techAvg = poomsaeScores ? calculateAverage(poomsaeScores.technical, numJudges) : 0;
    const presAvg = poomsaeScores ? calculateAverage(poomsaeScores.presentation, numJudges) : 0;
    const finalScore = techAvg + presAvg;

    const poomsaeCount = category.poomsaeConfig.count;
    const poomsaeName = category.poomsaeConfig.poomsaes[poomsaeIndex];
    const poomsaeTitle = poomsaeCount === 1 
        ? `Poomsae Único${poomsaeName ? `: ${poomsaeName}` : ''}`
        : `Poomsae ${poomsaeIndex + 1}${poomsaeName ? `: ${poomsaeName}` : ''}`;

    return (
        <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            <div className="text-center mb-8 relative z-10">
                <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm">{poomsaeTitle}</h4>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                {/* Judge Scores */}
                <div className="space-y-6">
                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                        <h4 className="font-bold text-blue-400 mb-4 uppercase tracking-wider text-sm border-b border-blue-500/30 pb-2">Técnica</h4>
                        {event.judges.map((judge, index) => (
                            <div key={judge.id} className="flex items-center justify-between space-x-4 mb-3">
                                <label className="text-sm font-semibold text-blue-200">Juez {index + 1}</label>
                                <div className="w-24">
                                    <ScoreInput
                                        initialValue={poomsaeScores?.technical?.[index] ?? 0}
                                        onCommit={(value) => handleScoreChange(competitorId, poomsaeIndex, index, 'technical', value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20">
                        <h4 className="font-bold text-red-400 mb-4 uppercase tracking-wider text-sm border-b border-red-500/30 pb-2">Presentación</h4>
                        {event.judges.map((judge, index) => (
                            <div key={judge.id} className="flex items-center justify-between space-x-4 mb-3">
                                <label className="text-sm font-semibold text-red-200">Juez {index + 1}</label>
                                <div className="w-24">
                                     <ScoreInput
                                        initialValue={poomsaeScores?.presentation?.[index] ?? 0}
                                        onCommit={(value) => handleScoreChange(competitorId, poomsaeIndex, index, 'presentation', value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Averages and Final Score */}
                <div className="flex flex-col justify-center items-center bg-slate-900/50 p-8 rounded-2xl border border-white/5">
                    <div className="w-full text-center mb-8 bg-blue-900/10 p-4 rounded-xl border border-blue-500/10">
                        <p className="text-blue-400 text-sm uppercase tracking-widest font-bold mb-1">Promedio Técnica</p>
                        <p className="text-5xl font-black text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{techAvg.toFixed(2)}</p>
                    </div>
                    <div className="w-full text-center mb-10 bg-red-900/10 p-4 rounded-xl border border-red-500/10">
                        <p className="text-red-400 text-sm uppercase tracking-widest font-bold mb-1">Promedio Presentación</p>
                        <p className="text-5xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{presAvg.toFixed(2)}</p>
                    </div>
                    <div className="w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 group-hover:bg-white/10 transition-colors"></div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] mb-2 text-indigo-100 relative z-10">PUNTAJE FINAL</p>
                        <p className="text-7xl font-black tracking-tighter relative z-10 drop-shadow-md">{finalScore.toFixed(2)}</p>
                    </div>
                </div>
            </form>
        </div>
    );
  };

  // --- Render Logic ---

  const renderCompetitionContent = () => {
    switch (category.system) {
      case CompetitionSystem.Rounds:
        if (category.competitors.length === 0) {
          return <p>No hay competidores en esta categoría.</p>;
        }
        const currentCompetitor = category.competitors[currentCompetitorIndex];
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <RoundsCompetitorList
                competitors={category.competitors}
                scores={scores}
                currentCompetitorId={currentCompetitor.id}
                numJudges={numJudges}
                poomsaeCount={category.poomsaeConfig.count}
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-slate-400 text-xl font-normal">Puntuando a:</span> 
                    <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">{currentCompetitor.name}</span>
                </h3>
                <p className="text-lg text-slate-400 mt-2 font-light">
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider text-slate-300 border border-white/10">
                        Poomsae {currentPoomsaeIndex + 1} de {category.poomsaeConfig.count}
                    </span>
                </p>
              </div>
              <RoundsScoringPanel competitorId={currentCompetitor.id} poomsaeIndex={currentPoomsaeIndex} />
              <div className="mt-6 flex justify-between">
                <button onClick={handleUndo} disabled={history.length === 0} className="bg-yellow-500 text-white py-2 px-4 rounded disabled:bg-gray-400">Deshacer</button>
                {renderRoundsControls()}
              </div>
            </div>
          </div>
        );

      case CompetitionSystem.Pyramid:
        if (!currentMatch) {
          return <p>No hay un encuentro seleccionado. Por favor, configure uno desde la pantalla de configuración.</p>;
        }
        
        // Calculate all scores
        const scoreBlueP1 = calculatePoomsaeFinalScore(currentMatch.scoreBlueP1, numJudges);
        const scoreRedP1 = calculatePoomsaeFinalScore(currentMatch.scoreRedP1, numJudges);
        const scoreBlueP2 = calculatePoomsaeFinalScore(currentMatch.scoreBlueP2, numJudges);
        const scoreRedP2 = calculatePoomsaeFinalScore(currentMatch.scoreRedP2, numJudges);

        // Calculate final scores (average if both poomsaes are scored)
        const finalScoreBlue = category.poomsaeConfig.count === 2 && scoreBlueP1 > 0 && scoreBlueP2 > 0
            ? (scoreBlueP1 + scoreBlueP2) / 2
            : (scoreBlueP1 || scoreBlueP2);
        const finalScoreRed = category.poomsaeConfig.count === 2 && scoreRedP1 > 0 && scoreRedP2 > 0
            ? (scoreRedP1 + scoreRedP2) / 2
            : (scoreRedP1 || scoreRedP2);

        // Determine if we can move to P2
        const canMoveToP2 = category.poomsaeConfig.count === 2 && pyramidPoomsaeIndex === 0;
        
        // Determine if we can declare winner - Simplified to always allow if competitors exist
        // This avoids issues where score validation logic prevents buttons from showing
        const canDeclareWinner = currentMatch.competitorBlue && currentMatch.competitorRed;

        // Automatic winner determination based on WT rules
        const determineWinner = (): 'blue' | 'red' | 'tie' => {
            // Step 1: Compare Final Scores
            if (finalScoreBlue > finalScoreRed) return 'blue';
            if (finalScoreRed > finalScoreBlue) return 'red';

            // Step 2: Compare Average Presentation Scores
            const getAvgPresentation = (scores: Score | null | undefined) => {
                if (!scores || !scores.presentation) return 0;
                const validScores = scores.presentation.filter(s => s !== null && s >= 0) as number[];
                if (validScores.length === 0) return 0;
                let evaluatedScores = validScores;
                if (numJudges >= 5 && validScores.length >= 3) {
                    const sorted = [...validScores].sort((a, b) => a - b);
                    evaluatedScores = sorted.slice(1, -1);
                }
                return evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length;
            };

            const presAvgBlueP1 = getAvgPresentation(currentMatch.scoreBlueP1);
            const presAvgBlueP2 = getAvgPresentation(currentMatch.scoreBlueP2);
            const presAvgRedP1 = getAvgPresentation(currentMatch.scoreRedP1);
            const presAvgRedP2 = getAvgPresentation(currentMatch.scoreRedP2);

            const avgPresBlue = category.poomsaeConfig.count === 2 && presAvgBlueP1 > 0 && presAvgBlueP2 > 0
                ? (presAvgBlueP1 + presAvgBlueP2) / 2
                : (presAvgBlueP1 || presAvgBlueP2);
            const avgPresRed = category.poomsaeConfig.count === 2 && presAvgRedP1 > 0 && presAvgRedP2 > 0
                ? (presAvgRedP1 + presAvgRedP2) / 2
                : (presAvgRedP1 || presAvgRedP2);

            if (avgPresBlue > avgPresRed) return 'blue';
            if (avgPresRed > avgPresBlue) return 'red';

            // Step 3: Compare Highest Individual Presentation Score
            const getMaxPresentation = (scores: Score | null | undefined) => {
                if (!scores || !scores.presentation) return 0;
                const validScores = scores.presentation.filter(s => s !== null && s >= 0) as number[];
                return validScores.length > 0 ? Math.max(...validScores) : 0;
            };

            const maxPresBlue = Math.max(getMaxPresentation(currentMatch.scoreBlueP1), getMaxPresentation(currentMatch.scoreBlueP2));
            const maxPresRed = Math.max(getMaxPresentation(currentMatch.scoreRedP1), getMaxPresentation(currentMatch.scoreRedP2));

            if (maxPresBlue > maxPresRed) return 'blue';
            if (maxPresRed > maxPresBlue) return 'red';

            // Step 4: Technical Tie
            return 'tie';
        };

        const handleMoveToP2 = () => {
            setPyramidPoomsaeIndex(1);
        };

        const handleAutoDeclareWinner = () => {
            const winner = determineWinner();
            handleDeclareWinner(winner);
        };

        // Determine which poomsae is being scored for display
        const currentPoomsaeNum = pyramidPoomsaeIndex + 1;
        const poomsaeName = category.poomsaeConfig.poomsaes[pyramidPoomsaeIndex] || '';

        return (
            <div>
                {/* Category and Match Info Header */}
                <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white p-4 rounded-lg mb-4 shadow-lg">
                    <h2 className="text-2xl font-bold text-center mb-1">{category.title}</h2>
                    <p className="text-lg text-center font-semibold">
                        Fase de Llave y Número de Encuentro: {currentMatch.phase} - Encuentro #{currentMatch.matchNumber}
                    </p>
                    <p className="text-base text-center mt-1">
                        Puntuando Poomsae {currentPoomsaeNum} de {category.poomsaeConfig.count}
                        {poomsaeName && <span className="font-semibold"> - {poomsaeName}</span>}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {currentMatch.competitorBlue && (
                        <PyramidCompetitorPanel
                            color="blue"
                            competitor={currentMatch.competitorBlue}
                            judges={event.judges}
                            onScoreChange={handlePyramidScoreChange}
                            scoresP1={currentMatch.scoreBlueP1}
                            scoresP2={currentMatch.scoreBlueP2}
                            poomsaeCount={category.poomsaeConfig.count}
                            numJudges={numJudges}
                            currentPoomsaeIndex={pyramidPoomsaeIndex}
                        />
                    )}
                    {currentMatch.competitorRed && (
                        <PyramidCompetitorPanel
                            color="red"
                            competitor={currentMatch.competitorRed}
                            judges={event.judges}
                            onScoreChange={handlePyramidScoreChange}
                            scoresP1={currentMatch.scoreRedP1}
                            scoresP2={currentMatch.scoreRedP2}
                            poomsaeCount={category.poomsaeConfig.count}
                            numJudges={numJudges}
                            currentPoomsaeIndex={pyramidPoomsaeIndex}
                        />
                    )}
                </div>

                {/* Control Buttons */}
                <div className="mt-6 flex flex-col gap-4">
                    {/* Poomsae Navigation */}
                    {canMoveToP2 && (
                        <div className="flex justify-center">
                            <button 
                                onClick={handleMoveToP2} 
                                className="bg-purple-600 text-white py-3 px-8 rounded-xl font-bold text-lg hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3"
                            >
                                <span>Pasar a Poomsae 2</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
                                </svg>
                            </button>
                        </div>
                    )}
                    
                    {/* Winner Declaration Buttons */}
                    {canDeclareWinner && !currentMatch.winner && (
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={handleAutoDeclareWinner} 
                                    className="bg-emerald-600 text-white py-3 px-8 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                    </svg>
                                    Determinar Ganador Automático
                                </button>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={() => handleDeclareWinner('blue')} 
                                    className="bg-blue-600 text-white py-3 px-8 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                                        <path d="M4 22h16"/>
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                                    </svg>
                                    Ganador CHONG (Azul)
                                </button>
                                <button 
                                    onClick={() => handleDeclareWinner('red')} 
                                    className="bg-red-600 text-white py-3 px-8 rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                                        <path d="M4 22h16"/>
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                                    </svg>
                                    Ganador HONG (Rojo)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Continue Category Button - Shows after winner is declared and protocol finishes */}
                    {currentMatch.winner && showContinueButton && (
                        <div className="flex justify-center mt-6 animate-bounce">
                            <button 
                                onClick={handleContinueCategory} 
                                className="bg-amber-500 text-black py-4 px-12 rounded-2xl font-black text-2xl hover:bg-amber-400 shadow-2xl border-4 border-amber-600 transform transition hover:scale-105 flex items-center gap-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                CONTINUAR CATEGORÍA
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );

      case 'Freestyle':
        return (
            <FreestyleScoring
                competitors={category.competitors}
                judges={event.judges}
                onFinalize={handleFinalizeCategory}
            />
        );

      default:
        return <p>Sistema de competencia no reconocido.</p>;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-10 pointer-events-none mix-blend-overlay"></div>
      <Header />
      <main className="max-w-7xl mx-auto py-8 px-6 relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/5 min-h-[80vh]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-white/10 pb-6 mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{category.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-widest">Evento: <span className="text-slate-900 dark:text-white">{event.name}</span></p>
            </div>
            <div className="flex space-x-4">
                {category.system === CompetitionSystem.Pyramid && (
                     <button 
                        onClick={() => setShowBracketModal(true)}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 py-2 px-6 rounded-lg font-bold hover:bg-indigo-500/30 transition-all flex items-center gap-2 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        Ver Llave
                    </button>
                )}
                <button onClick={handleFinalizeCategory} className="bg-red-500/10 text-red-400 border border-red-500/30 py-2 px-6 rounded-lg hover:bg-red-500/20 text-sm font-bold transition-colors">Finalizar Categoría</button>
                <button onClick={() => setScreen('CATEGORY')} className="bg-slate-700 text-slate-300 py-2 px-6 rounded-lg hover:bg-slate-600 text-sm font-bold transition-all border border-white/5">&larr; Volver a Categorías</button>
            </div>
          </div>
          {renderCompetitionContent()}
        </div>
      </main>

      {/* View Bracket Modal */}
      {showBracketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-800/50">
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase">Llave de Competencia</h3>
                    <button onClick={() => setShowBracketModal(false)} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </button>
                </div>
                <div className="p-6 overflow-x-auto flex-1 bg-slate-900/50">
                        <PyramidBracket matches={category.pyramidMatches || []} />
                </div>
                <div className="p-6 border-t border-white/10 bg-slate-800/50 flex justify-end">
                    <button onClick={() => setShowBracketModal(false)} className="bg-slate-700 text-white py-2 px-6 rounded-lg font-bold hover:bg-slate-600 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
    