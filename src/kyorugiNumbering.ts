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

        // 4. Weight (Densidad de Peso, extract number)
        const getWeightNum = (w: string) => {
            const match = w.match(/\d+/);
            return match ? parseInt(match[0], 10) : 999;
        };
        const numA = getWeightNum(a.weight || '');
        const numB = getWeightNum(b.weight || '');
        if (numA !== numB) return numA - numB;
        return (a.weight || '').localeCompare(b.weight || '');
    });
};

const OLA_1_PHASES = ['Ronda de 128', 'Ronda de 64', '32avos de Final', '16avos de Final', 'Octavos de Final'];
const OLA_2_PHASES = ['Cuartos de Final', 'Semifinal'];
const OLA_3_PHASES = ['Final'];

export const generateGlobalNumbering = (event: Event, numAreas: number): Event => {
    const newEvent = JSON.parse(JSON.stringify(event)) as Event;
    
    const kyorugiCats = newEvent.categories.filter(c => c.modality === 'Combate (Kyorugi)' && c.pyramidMatches && c.pyramidMatches.length > 0);
    if (kyorugiCats.length === 0) return newEvent;

    const sortedCats = sortKyorugiCategories(kyorugiCats);
    const jump = getJumpDifferential(numAreas);

    let currentStartId = 1;
    let highestIdUsed = 0;

    // Helper to process a wave of matches for a specific category with jump logic
    const processWaveWithJump = (cat: Category, validPhases: string[]) => {
        const matchesInWave = cat.pyramidMatches.filter(m => !m.byeWinner && validPhases.includes(m.phase));
        
        if (matchesInWave.length > 0) {
            let id = currentStartId;
            for (const match of matchesInWave) {
                match.matchNumber = id++;
                if (id - 1 > highestIdUsed) highestIdUsed = id - 1;
            }
            
            // Apply Differential Offset
            const blocksNeeded = Math.ceil(matchesInWave.length / jump) || 1;
            currentStartId += blocksNeeded * jump;
        }
    };

    // 1. Ola I (Rondas de Apertura)
    for (const cat of sortedCats) {
        processWaveWithJump(cat, OLA_1_PHASES);
    }

    // 2. Ola II (Rondas de Progresión)
    for (const cat of sortedCats) {
        processWaveWithJump(cat, OLA_2_PHASES);
    }

    // 3. Ola III (The Championship Wave - Finales Consecutivas)
    // No differential applied. Start consecutively after the highest ID used.
    let finalsStartId = highestIdUsed + 1;
    for (const cat of sortedCats) {
        const matchesInWave = cat.pyramidMatches.filter(m => !m.byeWinner && OLA_3_PHASES.includes(m.phase));
        for (const match of matchesInWave) {
            match.matchNumber = finalsStartId++;
        }
    }

    return newEvent;
};
