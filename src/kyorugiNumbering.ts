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
        const ageA = AGE_ORDER[a.ageGroup] || 99;
        const ageB = AGE_ORDER[b.ageGroup] || 99;
        if (ageA !== ageB) return ageA - ageB;

        const beltA = BELT_ORDER[a.beltLevel] || 99;
        const beltB = BELT_ORDER[b.beltLevel] || 99;
        if (beltA !== beltB) return beltA - beltB;

        const genA = GENDER_ORDER[a.gender] || 99;
        const genB = GENDER_ORDER[b.gender] || 99;
        if (genA !== genB) return genA - genB;

        const wA = a.weight || '';
        const wB = b.weight || '';
        return wA.localeCompare(wB);
    });
};

const PHASE_ORDER = [
    'Ronda de 128', 'Ronda de 64', '32avos de Final', '16avos de Final', 
    'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final'
];

const getPhaseWeight = (phase: string): number => {
    const idx = PHASE_ORDER.indexOf(phase);
    return idx === -1 ? 99 : idx;
};

export const generateGlobalNumbering = (event: Event, numAreas: number): Event => {
    const newEvent = JSON.parse(JSON.stringify(event)) as Event;
    
    const kyorugiCats = newEvent.categories.filter(c => c.modality === 'Combate (Kyorugi)' && c.pyramidMatches && c.pyramidMatches.length > 0);
    if (kyorugiCats.length === 0) return newEvent;

    const sortedCats = sortKyorugiCategories(kyorugiCats);
    const jump = getJumpDifferential(numAreas);

    // Group matches per category into phases
    const catQueues: { catId: string, phases: PyramidMatch[][] }[] = sortedCats.map(cat => {
        const realMatches = cat.pyramidMatches.filter(m => !m.byeWinner);
        
        // Group by phase
        const phaseMap: Record<string, PyramidMatch[]> = {};
        for (const m of realMatches) {
            if (!phaseMap[m.phase]) phaseMap[m.phase] = [];
            phaseMap[m.phase].push(m);
        }

        // Sort phases
        const sortedPhases = Object.keys(phaseMap).sort((a, b) => getPhaseWeight(a) - getPhaseWeight(b));
        
        return {
            catId: cat.id,
            phases: sortedPhases.map(p => phaseMap[p]) // Array of arrays (each is a phase wave)
        };
    });

    let nextCheckinStartId = 1;
    let highestIdUsed = 0;

    // 1. Fase I: La Ola de Rondas Iniciales (Check-in Wave)
    for (const catQueue of catQueues) {
        if (catQueue.phases.length > 0) {
            const firstPhaseMatches = catQueue.phases.shift()!;
            let id = nextCheckinStartId;
            
            for (const match of firstPhaseMatches) {
                match.matchNumber = id++;
                if (id - 1 > highestIdUsed) highestIdUsed = id - 1;
            }
            
            // Apply Differential Offset
            const blocksNeeded = Math.ceil(firstPhaseMatches.length / jump) || 1;
            nextCheckinStartId += blocksNeeded * jump;
        }
    }

    // 2. Fase II+: La Ola de Progresión (Sequential)
    let nextSequentialId = highestIdUsed + 1;
    let hasMorePhases = true;
    
    while (hasMorePhases) {
        hasMorePhases = false;
        // Round robin across categories for subsequent phases
        for (const catQueue of catQueues) {
            if (catQueue.phases.length > 0) {
                hasMorePhases = true;
                const nextPhaseMatches = catQueue.phases.shift()!;
                
                for (const match of nextPhaseMatches) {
                    match.matchNumber = nextSequentialId++;
                }
            }
        }
    }

    // Write numbers back to newEvent
    for (const catQueue of catQueues) {
        const targetCat = newEvent.categories.find(c => c.id === catQueue.catId);
        if (targetCat) {
            // The matches in the event are the same objects (since we grouped references)
            // Wait! Did we modify references?
            // In JavaScript, `phaseMap[m.phase].push(m)` pushes the reference.
            // When we did `match.matchNumber = ...`, we modified the reference!
            // And since `kyorugiCats` array elements are references to `newEvent.categories` elements,
            // we have mutated the `newEvent` directly!
        }
    }

    return newEvent;
};
