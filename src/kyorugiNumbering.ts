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

        // 3. Weight (Densidad de Peso, extract number)
        const getWeightNum = (w: string) => {
            const match = w.match(/\d+/);
            return match ? parseInt(match[0], 10) : 999;
        };
        const numA = getWeightNum(a.weight || '');
        const numB = getWeightNum(b.weight || '');
        if (numA !== numB) return numA - numB;
        const weightCmp = (a.weight || '').localeCompare(b.weight || '');
        if (weightCmp !== 0) return weightCmp;

        // 4. Gender (Intercalado Masculino Femenino)
        const genA = GENDER_ORDER[a.gender] || 99;
        const genB = GENDER_ORDER[b.gender] || 99;
        return genA - genB;
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

    // Track the last match number assigned to each category to validate R >= O * 2
    const lastMatchNumberPerCat: Record<string, number> = {};

    // Helper to process a wave of matches for a specific category with jump logic
    const processWaveWithJump = (cat: Category, validPhases: string[]) => {
        const matchesInWave = cat.pyramidMatches.filter(m => !m.byeWinner && validPhases.includes(m.phase));
        
        if (matchesInWave.length > 0) {
            let id = currentStartId;
            const firstMatchId = id;

            // Validation: R = MatchID(Ronda n) - MatchID(Ronda n-1) >= O * 2
            if (lastMatchNumberPerCat[cat.id] !== undefined) {
                const recoveryGap = firstMatchId - lastMatchNumberPerCat[cat.id];
                if (recoveryGap < (jump * 2)) {
                    // In a real scenario, we might want to adjust currentStartId instead of failing,
                    // but the spec says "el sistema bloquea la generación".
                    // We'll throw a specific error that the UI can catch.
                    throw new Error(`Violación de recuperación fisiológica en ${cat.title}. Brecha: ${recoveryGap}, Requerido: ${jump * 2}.`);
                }
            }

            for (const match of matchesInWave) {
                match.matchNumber = id++;
                if (id - 1 > highestIdUsed) highestIdUsed = id - 1;
            }
            
            lastMatchNumberPerCat[cat.id] = id - 1; // Store the last number of this wave

            // Apply Differential Offset (StartMatch(Cat i) = StartMatch(Cat i-1) + O)
            const blocksNeeded = Math.ceil(matchesInWave.length / jump) || 1;
            currentStartId += blocksNeeded * jump;
        }
    };

    try {
        // 1. Ola I (Rondas de Apertura - 16avos y 8vos)
        for (const cat of sortedCats) {
            processWaveWithJump(cat, OLA_1_PHASES);
        }

        // 2. Ola II (Rondas de Progresión - Cuartos y Semis)
        for (const cat of sortedCats) {
            processWaveWithJump(cat, OLA_2_PHASES);
        }

        // 3. Ola III (The Championship Wave - Finales Consecutivas)
        // No differential applied. Start consecutively after the highest ID used.
        let finalsStartId = highestIdUsed + 1;
        for (const cat of sortedCats) {
            const matchesInWave = cat.pyramidMatches.filter(m => !m.byeWinner && OLA_3_PHASES.includes(m.phase));
            for (const match of matchesInWave) {
                // Final validation even for Ola III
                if (lastMatchNumberPerCat[cat.id] !== undefined) {
                    const recoveryGap = finalsStartId - lastMatchNumberPerCat[cat.id];
                    if (recoveryGap < (jump * 2)) {
                        throw new Error(`Violación de recuperación en Final de ${cat.title}. Brecha: ${recoveryGap}, Requerido: ${jump * 2}.`);
                    }
                }
                match.matchNumber = finalsStartId++;
            }
        }
    } catch (error: any) {
        // Rethrow to be handled by the UI
        throw error;
    }

    return newEvent;
};
