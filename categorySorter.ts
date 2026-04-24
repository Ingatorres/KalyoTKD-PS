import { Category } from './types';

export const sortCategories = (categories: Category[]): Category[] => {
    const beltOrder = ['principiante', 'avanzado', 'negro'];
    const divisionOrder = ['individual', 'pareja', 'equipo'];
    const genderOrder = ['masculino', 'femenino'];

    return [...categories].sort((catA, catB) => {
        // 1. Belt Level
        const beltA = beltOrder.findIndex(b => catA.beltLevel.toLowerCase().includes(b));
        const beltB = beltOrder.findIndex(b => catB.beltLevel.toLowerCase().includes(b));
        if (beltA !== beltB) {
            // Put categories with unknown belts at the end
            if (beltA === -1) return 1;
            if (beltB === -1) return -1;
            return beltA - beltB;
        }

        // 2. Modality / Division
        const divA = divisionOrder.findIndex(d => catA.division.toLowerCase().includes(d));
        const divB = divisionOrder.findIndex(d => catB.division.toLowerCase().includes(d));
        if (divA !== divB) {
            if (divA === -1) return 1;
            if (divB === -1) return -1;
            return divA - divB;
        }

        // 3. Gender
        const genA = genderOrder.findIndex(g => catA.gender.toLowerCase().includes(g));
        const genB = genderOrder.findIndex(g => catB.gender.toLowerCase().includes(g));
        if (genA !== genB) {
            if (genA === -1) return 1;
            if (genB === -1) return -1;
            return genA - genB;
        }

        return 0;
    });
};
