import { Category } from '../types';

// Source: World Taekwondo Poomsae Competition Rules & Interpretation
// This data structure reflects the tables provided in the user's specification.

export const POOMSAE_LISTS = {
  taekwondo: {
    principiante: ['Taegeuk 1', 'Taegeuk 2', 'Taegeuk 3', 'Taegeuk 4'],
    avanzado: ['Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8'],
    negro: {
      individual: {
        cadete: ['Taegeuk 4', 'Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek'],
        junior: ['Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon'],
        under30: ['Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae'],
        under40: ['Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon'],
        under50: ['Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon'],
        under60: ['Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon', 'Hansu'],
        over65: ['Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon', 'Hansu'],
      },
      pareja: {
        cadete: ['Taegeuk 4', 'Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek'],
        junior: ['Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon'],
        under30: ['Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae'],
        under50: ['Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon'],
        under60: ['Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon', 'Hansu'],
        over60: ['Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon', 'Hansu'],
      },
      equipo: {
         cadete: ['Taegeuk 4', 'Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek'],
        junior: ['Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon'],
        under30: ['Taegeuk 7', 'Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae'],
        under50: ['Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin', 'Jitae', 'Chonkwon'],
      }
    }
  },
  para_taekwondo: {
    // Ages are Cadete (12-14), Junior (14-17), Senior (16+)
    cadete: {
      // FIX: Changed `grupo1` to `group1` to match the expected return type.
      group1: ['Taegeuk 1', 'Taegeuk 2', 'Taegeuk 3'],
      // FIX: Changed `grupo2` to `group2` to match the expected return type.
      group2: ['Taegeuk 4', 'Taegeuk 5', 'Taegeuk 6'],
    },
    junior: {
      // FIX: Changed `grupo1` to `group1` to match the expected return type.
      group1: ['Taegeuk 2', 'Taegeuk 3', 'Taegeuk 4', 'Taegeuk 5'],
      // FIX: Changed `grupo2` to `group2` to match the expected return type.
      group2: ['Taegeuk 6', 'Taegeuk 7', 'Taegeuk 8', 'Koryo'],
    },
    senior: { 
      // FIX: Changed `grupo1` to `group1` to match the expected return type.
      group1: ['Taegeuk 3', 'Taegeuk 4', 'Taegeuk 5', 'Taegeuk 6', 'Taegeuk 7'],
      // FIX: Changed `grupo2` to `group2` to match the expected return type.
      group2: ['Taegeuk 8', 'Koryo', 'Keumgang', 'Taebaek', 'Pyongwon', 'Shipjin'],
    }
  }
};

const getAgeKey = (ageGroup: string): string => {
    if (ageGroup.includes('Cadete')) return 'cadete';
    if (ageGroup.includes('Junior')) return 'junior';
    if (ageGroup.includes('Under 30')) return 'under30';
    if (ageGroup.includes('Under 40')) return 'under40';
    if (ageGroup.includes('Under 50')) return 'under50';
    if (ageGroup.includes('Under 60')) return 'under60';
    if (ageGroup.includes('Over 65') || ageGroup.includes('Over 60')) return 'over65';
    // For para-taekwondo, junior covers 14-17
    if (ageGroup.includes('15-17')) return 'junior';
    // All other WT ages for Para are either Cadete or Senior (16+)
    return 'senior';
}

const getDivisionKey = (division: string): 'individual' | 'pareja' | 'equipo' => {
    switch (division.toLowerCase()) {
        case 'pareja': return 'pareja';
        case 'equipo': return 'equipo';
        default: return 'individual';
    }
}

export function getPoomsaeList(category: Category): { all?: string[], group1?: string[], group2?: string[] } {
    if (category.discipline === 'Para-Taekwondo') {
        const ageKey = getAgeKey(category.ageGroup);
        let lists;
        if (ageKey === 'cadete') lists = POOMSAE_LISTS.para_taekwondo.cadete;
        else if (ageKey === 'junior') lists = POOMSAE_LISTS.para_taekwondo.junior;
        else lists = POOMSAE_LISTS.para_taekwondo.senior;

        // Rule: Exclude Keumgang for P30 disability group.
        if (category.disabilityGroup === 'P30') {
            return {
                ...lists,
                group2: lists.group2.filter(p => p !== 'Keumgang')
            };
        }
        return lists;
    }
    
    switch (category.beltLevel.toLowerCase()) {
        case 'principiante': return { all: POOMSAE_LISTS.taekwondo.principiante };
        case 'avanzado': return { all: POOMSAE_LISTS.taekwondo.avanzado };
        case 'negro':
            const divisionKey = getDivisionKey(category.division);
            const ageKey = getAgeKey(category.ageGroup);
            const divisionLists = POOMSAE_LISTS.taekwondo.negro[divisionKey];
            
            // Fallback logic for age groups that don't exist in a division (e.g. over65 in equipo)
            const ageSpecificList = (divisionLists as any)[ageKey] || (divisionLists as any)['under30']; // Default fallback

            return { all: ageSpecificList };
        default: return { all: [] };
    }
}

/**
 * Draws random poomsaes based on the provided options.
 * @param count The number of poomsaes to draw (1 or 2).
 * @param options An object containing available poomsaes, either in a single 'all' list or separated into 'group1' and 'group2'.
 * @returns An array of drawn poomsae names.
 */
/**
 * Draws random poomsaes based on the provided options.
 * Prevents repeating the same poomsae in a single draw.
 * @param count The number of poomsaes to draw (1 or 2).
 * @param options Available poomsaes list or groups.
 * @param exclude Optional list of poomsaes to avoid (e.g. from previous match).
 * @returns An array of drawn poomsae names.
 */
export const drawPoomsaes = (
    count: 1 | 2, 
    options: { all?: string[], group1?: string[], group2?: string[] },
    exclude: string[] = []
): (string | null)[] => {
    if (options.all) {
        // Filter out excluded ones if possible (leave at least one option)
        let pool = options.all.filter(p => !exclude.includes(p));
        if (pool.length === 0) pool = options.all; // Fallback if everything is excluded

        // Shuffle
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        
        if (count === 1) return [shuffled[0] || null];
        
        // Ensure second poomsae is different from first
        const p1 = shuffled[0] || null;
        const p2 = shuffled.length > 1 ? shuffled[1] : (shuffled[0] || null);
        return [p1, p2];
    }

    if (options.group1 && options.group2) {
        if (options.group1.length === 0 || options.group2.length === 0) {
            return count === 1 ? [null] : [null, null];
        }

        // Try to draw from Group 1 avoiding exclude
        let pool1 = options.group1.filter(p => !exclude.includes(p));
        if (pool1.length === 0) pool1 = options.group1;
        const draw1 = pool1[Math.floor(Math.random() * pool1.length)];
        
        if (count === 1) return [draw1];
        
        // Try to draw from Group 2 avoiding draw1 and exclude
        let pool2 = options.group2.filter(p => p !== draw1 && !exclude.includes(p));
        if (pool2.length === 0) pool2 = options.group2.filter(p => p !== draw1);
        if (pool2.length === 0) pool2 = options.group2;
        
        const draw2 = pool2[Math.floor(Math.random() * pool2.length)];
        return [draw1, draw2];
    }

    return count === 1 ? [null] : [null, null];
};