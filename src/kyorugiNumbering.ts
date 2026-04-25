import { Category, PyramidMatch, Event } from '../types';

const getJumpDifferential = (numAreas: number): number => {
    if (numAreas <= 2) return 4;
    if (numAreas <= 4) return 10;
    if (numAreas <= 6) return 20;
    return 28; // 8 areas or more
};

// Hierarchy mapping for sorting categories
const AGE_ORDER: Record<string, number> = {
    'Pre-cadete C (6-7)': 1,
    'Pre-cadete B (8-9)': 2,
    'Pre-cadete A (10-11)': 3,
    'Festival Infantil (4-11)': 4,
    'Cadete (12-14)': 5,
    'Junior (15-17)': 6,
    'Mayores (17+)': 7,
    'Senior Master 1 (35-44)': 8,
    'Senior Master 2 (45-55)': 9
};

const BELT_ORDER: Record<string, number> = {
    'Principiante': 1,
    'Avanzado': 2,
    'Negro': 3
};

const GENDER_ORDER: Record<string, number> = {
    'Femenino': 1,
    'Masculino': 2,
    'Mixto': 3
};

const sortKyorugiCategories = (cats: Category[]): Category[] => {
    return [...cats].sort((a, b) => {
        // 1. Age
        const ageA = AGE_ORDER[a.ageGroup] || 99;
        const ageB = AGE_ORDER[b.ageGroup] || 99;
        if (ageA !== ageB) return ageA - ageB;

        // 2. Belt
        const beltA = BELT_ORDER[a.beltLevel] || 99;
        const beltB = BELT_ORDER[b.beltLevel] || 99;
        if (beltA !== beltB) return beltA - beltB;

        // 3. Gender
        const genA = GENDER_ORDER[a.gender] || 99;
        const genB = GENDER_ORDER[b.gender] || 99;
        if (genA !== genB) return genA - genB;

        // 4. Weight (Lexicographical or custom, simple string compare for now)
        const wA = a.weight || '';
        const wB = b.weight || '';
        return wA.localeCompare(wB);
    });
};

// Phase ordering (from earliest rounds to final)
const PHASE_ORDER = [
    'Ronda de 128', 'Ronda de 64', '32avos de Final', '16avos de Final', 
    'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final'
];

const getPhaseWeight = (phase: string): number => {
    const idx = PHASE_ORDER.indexOf(phase);
    return idx === -1 ? 99 : idx; // Earliest rounds first
};

export const generateGlobalNumbering = (event: Event, numAreas: number): Event => {
    const newEvent = JSON.parse(JSON.stringify(event)) as Event;
    
    const kyorugiCats = newEvent.categories.filter(c => c.modality === 'Combate (Kyorugi)' && c.pyramidMatches && c.pyramidMatches.length > 0);
    if (kyorugiCats.length === 0) return newEvent;

    const sortedCats = sortKyorugiCategories(kyorugiCats);
    const jump = getJumpDifferential(numAreas);

    // Prepare match queues per category
    const catQueues: { catId: string, matches: PyramidMatch[] }[] = sortedCats.map(cat => {
        // Get only REAL matches (no BYEs)
        const realMatches = cat.pyramidMatches.filter(m => !m.byeWinner);
        
        // Sort matches by phase (earliest first), then by original internal order (top-to-bottom)
        realMatches.sort((a, b) => {
            const pwA = getPhaseWeight(a.phase);
            const pwB = getPhaseWeight(b.phase);
            if (pwA !== pwB) return pwA - pwB;
            // Within same phase, keep original structural order (we assume they were generated top-to-bottom)
            return 0; 
        });

        return { catId: cat.id, matches: realMatches };
    });

    let currentGlobalMatchNumber = 1;
    let hasRemainingMatches = true;

    while (hasRemainingMatches) {
        hasRemainingMatches = false;

        for (const queue of catQueues) {
            if (queue.matches.length > 0) {
                hasRemainingMatches = true;
                
                // Take up to 'jump' matches from this category's queue
                const matchesToNumber = queue.matches.splice(0, jump);
                
                for (const match of matchesToNumber) {
                    // Find the actual match reference in the event
                    const targetCat = newEvent.categories.find(c => c.id === queue.catId);
                    if (targetCat) {
                        const targetMatch = targetCat.pyramidMatches.find(m => m.id === match.id);
                        if (targetMatch) {
                            targetMatch.matchNumber = currentGlobalMatchNumber++;
                        }
                    }
                }
            }
        }
    }

    return newEvent;
};
