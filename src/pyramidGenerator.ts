import { v4 as uuidv4 } from 'uuid';
import { Competitor, PyramidMatch } from '../types';

const getPhaseName = (roundSize: number): string => {
    if (roundSize === 2) return 'Final';
    if (roundSize === 4) return 'Semifinal';
    if (roundSize === 8) return 'Cuartos de Final';
    if (roundSize === 16) return 'Octavos de Final';
    if (roundSize === 32) return '16avos de Final';
    if (roundSize === 64) return '32avos de Final';
    return `Ronda de ${roundSize}`;
};

/**
 * Generates the "Position" order according to the N+1 rule (Rule of Sum).
 * e.g., Base 8 -> [1, 8, 4, 5, 2, 7, 3, 6]
 */
const generatePositionSequence = (n: number): number[] => {
    if (n === 2) return [1, 2];
    const prev = generatePositionSequence(n / 2);
    const result: number[] = [];
    for (const x of prev) {
        result.push(x);
        result.push(n + 1 - x);
    }
    return result;
};

/**
 * Distributes competitors so that the first 2 are always top seeds (Seed 1 and Seed 2).
 * Then distributes the rest by delegation to avoid early conflicts.
 */
function distributeByDelegation(competitors: Competitor[], bracketSize: number): (Competitor | null)[] {
    const bracket: (Competitor | null)[] = Array(bracketSize).fill(null);
    if (competitors.length === 0) return bracket;

    // The user specifically requested that the first two competitors in the list
    // are treated as the TOP 2 ranked and placed at the extremes of the pyramid.
    // In our generatePositionSequence, Seed 1 and Seed 2 are placed at opposite halves.
    
    let unseeded = [...competitors];
    
    // 1. Force Seed 1 and Seed 2
    if (unseeded.length > 0) {
        bracket[0] = unseeded.shift()!; // Seed 1 (goes to top half)
    }
    if (unseeded.length > 0) {
        bracket[1] = unseeded.shift()!; // Seed 2 (goes to bottom half)
    }

    // 2. Group the rest by delegation
    const groups: { [key: string]: Competitor[] } = {};
    unseeded.forEach(c => {
        const del = c.delegation.trim().toUpperCase();
        if (!groups[del]) groups[del] = [];
        groups[del].push(c);
    });

    const sortedDelegations = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    
    // We want to assign the remaining seeds in an order that separates them.
    // E.g., if a delegation has 2 people left, give them Seed 3 and Seed 4.
    // Seeds 3 and 4 are in opposite halves.
    // Let's create an optimal seeding order for the remaining slots (3 to bracketSize).
    // An easy way to spread them is simply sequentially: 3, 4, 5, 6...
    // Because generatePositionSequence already scatters sequential seeds.
    
    const remainingPositions = [];
    for (let i = 3; i <= bracketSize; i++) {
        remainingPositions.push(i);
    }

    let posIdx = 0;
    
    for (const delName of sortedDelegations) {
        const delCompetitors = groups[delName];
        for (const comp of delCompetitors) {
            if (posIdx < remainingPositions.length) {
                bracket[remainingPositions[posIdx] - 1] = comp;
                posIdx++;
            }
        }
    }

    return bracket;
}

export function generatePyramidBrackets(competitors: Competitor[]): PyramidMatch[] {
    const n = competitors.length;
    if (n < 2) return [];

    let bracketSize = 2;
    while (bracketSize < n) {
        bracketSize *= 2;
    }

    const bracketSlots = distributeByDelegation(competitors, bracketSize);
    const matchOrder = generatePositionSequence(bracketSize);
    
    const allMatches: PyramidMatch[] = [];
    const matchesByRound: { [key: number]: PyramidMatch[] } = {};

    const createMatch = (phase: string): PyramidMatch => ({
        id: uuidv4(),
        phase,
        matchNumber: 0,
        competitorBlue: null,
        competitorRed: null,
        winner: null,
        isReady: false,
        nextMatchId: null,
        winnerTargetSlot: null,
        scoreBlueP1: { technical: [], presentation: [] },
        scoreRedP1: { technical: [], presentation: [] },
        scoreBlueP2: { technical: [], presentation: [] },
        scoreRedP2: { technical: [], presentation: [] },
        poomsaes: [],
    });

    const firstRoundMatches: PyramidMatch[] = [];
    const firstPhase = getPhaseName(bracketSize);

    for (let i = 0; i < bracketSize / 2; i++) {
        const posBlue = matchOrder[2 * i];
        const posRed = matchOrder[2 * i + 1];

        const compBlue = bracketSlots[posBlue - 1];
        const compRed = bracketSlots[posRed - 1];

        const match = createMatch(firstPhase);
        match.competitorBlue = compBlue;
        match.competitorRed = compRed;

        if (compBlue && !compRed) {
            match.winner = 'blue';
            match.vaiWinner = 'blue';
            match.isReady = true;
        } else if (!compBlue && compRed) {
            match.winner = 'red';
            match.vaiWinner = 'red';
            match.isReady = true;
        } else if (compBlue && compRed) {
            match.isReady = true;
        }

        firstRoundMatches.push(match);
    }
    matchesByRound[bracketSize] = firstRoundMatches;
    allMatches.push(...firstRoundMatches);

    let currentRoundSize = bracketSize / 2;
    while (currentRoundSize >= 2) {
        const roundPhase = getPhaseName(currentRoundSize);
        const roundMatches: PyramidMatch[] = [];
        const prevRoundMatches = matchesByRound[currentRoundSize * 2];

        for (let i = 0; i < currentRoundSize / 2; i++) {
            const match = createMatch(roundPhase);
            const prevMatchBlue = prevRoundMatches[2 * i];
            const prevMatchRed = prevRoundMatches[2 * i + 1];

            prevMatchBlue.nextMatchId = match.id;
            prevMatchBlue.winnerTargetSlot = 'blue';
            prevMatchRed.nextMatchId = match.id;
            prevMatchRed.winnerTargetSlot = 'red';

            if (prevMatchBlue.winner) {
                match.competitorBlue = prevMatchBlue.winner === 'blue' ? prevMatchBlue.competitorBlue : prevMatchBlue.competitorRed;
            }
            if (prevMatchRed.winner) {
                match.competitorRed = prevMatchRed.winner === 'blue' ? prevMatchRed.competitorBlue : prevMatchRed.competitorRed;
            }
            
            // Recursive BYE logic: If only one competitor moved up to this match, they win automatically
            if (match.competitorBlue && !match.competitorRed && prevMatchBlue.winner) {
                match.winner = 'blue';
                match.vaiWinner = 'blue';
                match.isReady = true;
            } else if (!match.competitorBlue && match.competitorRed && prevMatchRed.winner) {
                match.winner = 'red';
                match.vaiWinner = 'red';
                match.isReady = true;
            } else if (match.competitorBlue && match.competitorRed) {
                match.isReady = true;
            }

            roundMatches.push(match);
        }
        matchesByRound[currentRoundSize] = roundMatches;
        allMatches.push(...roundMatches);
        currentRoundSize /= 2;
    }

    const matchesToNumber = allMatches.filter(m => !m.vaiWinner).sort((a, b) => {
        const getRoundWeight = (p: string) => {
            if (p.includes('32avos')) return 64;
            if (p.includes('16avos')) return 32;
            if (p.includes('Octavos')) return 16;
            if (p.includes('Cuartos')) return 8;
            if (p.includes('Semifinal')) return 4;
            if (p.includes('Final')) return 2;
            return 100;
        };
        const wA = getRoundWeight(a.phase);
        const wB = getRoundWeight(b.phase);
        if (wA !== wB) return wB - wA;
        return allMatches.indexOf(a) - allMatches.indexOf(b);
    });

    matchesToNumber.forEach((m, idx) => m.matchNumber = idx + 1);

    return allMatches;
}