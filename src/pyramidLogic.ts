import { PyramidMatch } from './types';

/**
 * Resets a match and all its propagated winners in the pyramid structure.
 * This is used for corrections when a match was scored incorrectly.
 */
export function resetMatchInPyramid(matches: PyramidMatch[], matchId: string): PyramidMatch[] {
    const newMatches = matches.map(m => ({ ...m }));
    const match = newMatches.find(m => m.id === matchId);
    
    if (!match) return newMatches;

    // 1. Reset current match
    match.winner = null;
    match.scoreBlueP1 = { technical: [], presentation: [] };
    match.scoreRedP1 = { technical: [], presentation: [] };
    match.scoreBlueP2 = { technical: [], presentation: [] };
    match.scoreRedP2 = { technical: [], presentation: [] };
    
    // Reset flags if needed (byeWinner should remain if it was a bye, but user wants to correct played matches)
    if (match.byeWinner) {
        // If it was a bye, usually we don't reset it, but if forced:
        // match.byeWinner = undefined;
    }

    // 2. Recursively clear winners and competitors in parent matches
    let nextId = match.nextMatchId;
    let currentMatch = match;

    while (nextId) {
        const parentMatch = newMatches.find(m => m.id === nextId);
        if (!parentMatch) break;

        // Clear the slot the winner occupied
        if (currentMatch.winnerTargetSlot === 'blue') {
            parentMatch.competitorBlue = null;
        } else if (currentMatch.winnerTargetSlot === 'red') {
            parentMatch.competitorRed = null;
        }

        // If the parent match also had a winner, reset it too
        if (parentMatch.winner) {
            parentMatch.winner = null;
            parentMatch.scoreBlueP1 = { technical: [], presentation: [] };
            parentMatch.scoreRedP1 = { technical: [], presentation: [] };
            parentMatch.scoreBlueP2 = { technical: [], presentation: [] };
            parentMatch.scoreRedP2 = { technical: [], presentation: [] };
            
            // Continue recursion
            nextId = parentMatch.nextMatchId;
            currentMatch = parentMatch;
        } else {
            // Stop recursion if parent has no winner
            nextId = null;
        }
    }

    return newMatches;
}
