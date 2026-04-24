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
/**
 * Distributes competitors so that those from the same delegation are as far apart as possible.
 * Uses a round-robin assignment into the optimal seeding sequence.
 */
function distributeByDelegation(competitors: Competitor[], bracketSize: number): (Competitor | null)[] {
    const bracket: (Competitor | null)[] = Array(bracketSize).fill(null);
    if (competitors.length === 0) return bracket;

    // 1. Separate Seeds (the first two competitors)
    const seeds = competitors.slice(0, 2);
    const remaining = competitors.slice(2);

    // 2. Group the remaining by delegation
    const groups: { [key: string]: Competitor[] } = {};
    remaining.forEach(c => {
        const del = c.delegation.trim().toUpperCase() || 'SIN_DELEGACION';
        if (!groups[del]) groups[del] = [];
        groups[del].push({...c});
    });

    // 3. Shuffle members within groups and the list of delegations
    Object.keys(groups).forEach(del => {
        groups[del].sort(() => Math.random() - 0.5);
    });
    const sortedDelegations = Object.keys(groups).sort((a, b) => {
        const diff = groups[b].length - groups[a].length;
        return diff !== 0 ? diff : Math.random() - 0.5;
    });

    // 4. Assign remaining competitors to assigned list (seeds 3..N)
    const assignedRest: Competitor[] = [];
    let hasMore = true;
    let memberIdx = 0;
    
    while (hasMore) {
        hasMore = false;
        for (const del of sortedDelegations) {
            if (memberIdx < groups[del].length) {
                assignedRest.push(groups[del][memberIdx]);
                hasMore = true;
            }
        }
        memberIdx++;
    }

    // 5. Build final assigned list: [Seed 1, Seed 2, ...Rest]
    const assignedCompetitors = [...seeds, ...assignedRest];

    // 6. Fill the bracket using the assigned sequence for seeds 1..N
    // Positions in matchOrder[pos-1] correspond to these indices
    for (let i = 0; i < assignedCompetitors.length; i++) {
        bracket[i] = assignedCompetitors[i];
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
            match.byeWinner = 'blue';
            match.isReady = true;
        } else if (!compBlue && compRed) {
            match.winner = 'red';
            match.byeWinner = 'red';
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
            
            const seedsPerMatch = bracketSize / currentRoundSize;
            
            const countSeeds = (matchIdx: number) => {
                const start = matchIdx * seedsPerMatch;
                let count = 0;
                for (let j = 0; j < seedsPerMatch; j++) {
                    if (bracketSlots[matchOrder[start + j] - 1]) count++;
                }
                return count;
            };

            const blueSeedsCount = countSeeds(2 * i);
            const redSeedsCount = countSeeds(2 * i + 1);

            // Recursive BYE logic: A match is an automatic winner (BYE) 
            // ONLY if one side has competitors and the other side is guaranteed to be empty.
            if (blueSeedsCount > 0 && redSeedsCount === 0) {
                if (match.competitorBlue) {
                    match.winner = 'blue';
                    match.byeWinner = 'blue';
                    match.isReady = true;
                }
            } else if (blueSeedsCount === 0 && redSeedsCount > 0) {
                if (match.competitorRed) {
                    match.winner = 'red';
                    match.byeWinner = 'red';
                    match.isReady = true;
                }
            } else if (blueSeedsCount > 0 && redSeedsCount > 0) {
                // Real match: ready only when both competitors are propagated
                if (match.competitorBlue && match.competitorRed) {
                    match.isReady = true;
                }
            }

            roundMatches.push(match);
        }
        matchesByRound[currentRoundSize] = roundMatches;
        allMatches.push(...roundMatches);
        currentRoundSize /= 2;
    }

    const matchesToNumber = allMatches.filter(m => !m.byeWinner).sort((a, b) => {
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