import { Score, Competitor, CompetitorScore, PyramidMatch } from '../types';

/**
 * Filters out null/negative scores and discards the highest and lowest scores for 5 or 7 judges.
 * @param scores - An array of scores from the judges.
 * @param numJudges - The total number of judges (3, 5, or 7).
 * @returns An array of the scores that should be considered for calculation.
 */
const getEvaluatedScores = (scores: (number | null)[], numJudges: number): number[] => {
    const validScores = scores.filter(s => s !== null && s >= 0) as number[];
    if (validScores.length === 0) return [];

    // For N=3, or if we don't have enough scores to discard, use all valid scores.
    if (numJudges < 5 || validScores.length < 3) {
        return validScores;
    } else { // For N=5 or N=7, discard min and max
        const sorted = [...validScores].sort((a, b) => a - b);
        return sorted.slice(1, -1); // Discard min and max
    }
};


/**
 * Calculates the average of a set of scores, applying the WT rule for discarding high/low scores.
 * @param scores - An array of scores from the judges.
 * @param numJudges - The total number of judges (3, 5, or 7).
 * @returns The calculated average score.
 */
export const calculateAverage = (scores: (number | null)[], numJudges: number): number => {
    const evaluatedScores = getEvaluatedScores(scores, numJudges);
    if (evaluatedScores.length === 0) return 0;

    const sum = evaluatedScores.reduce((a, b) => a + b, 0);
    return sum / evaluatedScores.length;
};

/**
 * Calculates the final score for a single poomsae from the technical and presentation scores.
 * @param score - The raw score object containing technical and presentation arrays.
 * @param numJudges - The number of judges.
 * @returns The total final score for the poomsae.
 */
export const calculatePoomsaeFinalScore = (score: Score | undefined | null, numJudges: number): number => {
    if (!score || !score.technical || !score.presentation) {
        return 0;
    }
    const techAvg = calculateAverage(score.technical, numJudges);
    const presAvg = calculateAverage(score.presentation, numJudges);
    const final = techAvg + presAvg;
    return isNaN(final) ? 0 : final;
};


/**
 * Calculates the combined final score for a competitor based on one or two poomsaes.
 * @param competitorScore - The competitor's score object.
 * @param numJudges - The number of judges.
 * @param poomsaeCount - The number of poomsaes to be performed (1 or 2).
 * @returns The competitor's final score, averaged if there are two poomsaes.
 */
export const calculateCompetitorFinalScore = (
    competitorScore: CompetitorScore, 
    numJudges: number, 
    poomsaeCount: 1 | 2
): number => {
    const p1_total = competitorScore.poomsae1 ? calculatePoomsaeFinalScore(competitorScore.poomsae1, numJudges) : 0;

    if (poomsaeCount === 1) {
        return p1_total;
    }

    const p2_total = competitorScore.poomsae2 ? calculatePoomsaeFinalScore(competitorScore.poomsae2, numJudges) : 0;

    if (p1_total > 0 && p2_total > 0) {
        return (p1_total + p2_total) / 2;
    }
    
    // If one poomsae hasn't been scored yet, the final score is just the one that has been.
    return p1_total || p2_total;
};


interface TieBreakDetails {
    finalScore: number;
    presentationAverage: number; // Kept for sorting in Rounds
    highestPresentationScore: number; // New for pyramid tie-breaking
}

/**
 * Gathers all necessary details for a competitor to perform a tie-break comparison.
 * @param scores - An array of Score objects (one for each poomsae).
 * @param numJudges - The number of judges.
 * @returns A TieBreakDetails object.
 */
export const getTieBreakDetails = (scores: Score[], numJudges: number): TieBreakDetails => {
    if (!scores || scores.length === 0) {
        return { finalScore: 0, presentationAverage: 0, highestPresentationScore: 0 };
    }

    const finalScores = scores.filter(s => s).map(s => calculatePoomsaeFinalScore(s, numJudges));
    const finalScore = finalScores.length > 0 ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : 0;

    const presentationAverages = scores.map(s => calculateAverage(s.presentation, numJudges));
    const presentationAverage = presentationAverages.reduce((a, b) => a + b, 0) / presentationAverages.length;

    const allPresentationScores = scores.flatMap(s => s.presentation).filter(s => typeof s === 'number') as number[];
    const highestPresentationScore = allPresentationScores.length > 0 ? Math.max(...allPresentationScores) : 0;

    return {
        finalScore,
        presentationAverage,
        highestPresentationScore,
    };
};


/**
 * Determines the winner between two competitors based on the detailed scoring rules.
 * @param scoresBlue - An array of Score objects for the blue competitor.
 * @param scoresRed - An array of Score objects for the red competitor.
 * @param numJudges - The number of judges.
 * @returns 'blue', 'red', or 'tie'.
 */
export const determineWinner = (
    scoresBlue: Score[],
    scoresRed: Score[],
    numJudges: number
): 'blue' | 'red' | 'tie' => {
    const detailsBlue = getTieBreakDetails(scoresBlue, numJudges);
    const detailsRed = getTieBreakDetails(scoresRed, numJudges);

    // 1. Compare Final Score (rounded to 3 decimal places to avoid float issues)
    const finalScoreBlue = parseFloat(detailsBlue.finalScore.toFixed(3));
    const finalScoreRed = parseFloat(detailsRed.finalScore.toFixed(3));
    if (finalScoreBlue > finalScoreRed) return 'blue';
    if (finalScoreRed > finalScoreBlue) return 'red';

    // 2. Compare Highest Individual Presentation Score
    if (detailsBlue.highestPresentationScore > detailsRed.highestPresentationScore) return 'blue';
    if (detailsRed.highestPresentationScore > detailsBlue.highestPresentationScore) return 'red';

    // 3. Absolute Tie
    return 'tie';
};

/**
 * Sorts competitors based on their final scores and the tie-breaking rules.
 * @param scores - Array of CompetitorScore objects.
 * @param competitors - Array of Competitor objects.
 * @param numJudges - The number of judges.
 * @param poomsaeCount - The number of poomsaes performed.
 * @returns A sorted array of objects containing competitor info and detailed scores.
 */
export const sortCompetitors = (
    scores: CompetitorScore[],
    competitors: Competitor[],
    numJudges: number,
    poomsaeCount: 1 | 2
) => {
    const detailedScores = competitors.map(c => {
        const competitorScore = scores.find(s => s.competitorId === c.id);
        const poomsaeScores = poomsaeCount === 1 
            ? [competitorScore?.poomsae1].filter(Boolean) as Score[]
            : [competitorScore?.poomsae1, competitorScore?.poomsae2].filter(Boolean) as Score[];
        
        const technicalAverages = poomsaeScores.map(s => calculateAverage(s.technical, numJudges));
        const technicalAverage = technicalAverages.reduce((a, b) => a + b, 0) / (technicalAverages.length || 1);

        const tieBreakDetails = getTieBreakDetails(poomsaeScores, numJudges);

        return {
            id: c.id,
            name: c.name,
            delegation: c.delegation, // Add this back
            techAvg: technicalAverage,
            // presAvg is an alias for presentationAverage in this context
            presAvg: tieBreakDetails.presentationAverage,
            ...tieBreakDetails
        };
    });

    detailedScores.sort((a, b) => {
        // Round scores to 3 decimal places to ensure consistent comparisons
        const finalScoreA = parseFloat(a.finalScore.toFixed(3));
        const finalScoreB = parseFloat(b.finalScore.toFixed(3));
        const presAvgA = parseFloat(a.presentationAverage.toFixed(3));
        const presAvgB = parseFloat(b.presentationAverage.toFixed(3));

        // 1. Final Score
        if (finalScoreB !== finalScoreA) {
            return finalScoreB - finalScoreA;
        }
        // 2. Presentation Average
        if (presAvgB !== presAvgA) {
            return presAvgB - presAvgA;
        }
        // 3. Technical Tie
        return 0;
    });

    return detailedScores;
};