import { Event, Category } from './types';
import { saveFileToEventFolder } from './tauriFileSaver';

export const exportCategoryToJson = async (event: Event, category: Category) => {
    const exportData = {
        version: '2.1.0',
        exportDate: new Date().toISOString(),
        eventName: event.name,
        eventId: event.id,
        pyramidCategories: [{
            categoryId: category.id,
            categoryTitle: category.title,
            system: category.system,
            discipline: category.discipline,
            modality: category.modality,
            division: category.division,
            gender: category.gender,
            ageGroup: category.ageGroup,
            beltLevel: category.beltLevel,
            disabilityGroup: category.disabilityGroup,
            poomsaeConfig: category.poomsaeConfig,
            competitors: category.competitors,
            pyramidMatches: category.pyramidMatches || []
        }]
    };

    const data = JSON.stringify(exportData, null, 2);
    const fileName = `Export_Kalyo_${category.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    const uint8Array = new TextEncoder().encode(data);

    await saveFileToEventFolder(event.name, fileName, uint8Array);
};

export const exportEventToJson = async (event: Event) => {
    const data = JSON.stringify(event, null, 2);
    const fileName = `Backup_Evento_${event.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    const uint8Array = new TextEncoder().encode(data);

    await saveFileToEventFolder(event.name, fileName, uint8Array);
};

export const exportMultipleCategoriesToJson = async (event: Event, categories: Category[]) => {
    // We wrap categories in the official interchange format so the Import Modal can read them
    const exportData = {
        version: '2.1.0',
        exportDate: new Date().toISOString(),
        eventName: event.name,
        eventId: event.id,
        pyramidCategories: categories.map(cat => ({
            categoryId: cat.id,
            categoryTitle: cat.title,
            system: cat.system,
            discipline: cat.discipline,
            modality: cat.modality,
            division: cat.division,
            gender: cat.gender,
            ageGroup: cat.ageGroup,
            beltLevel: cat.beltLevel,
            disabilityGroup: cat.disabilityGroup,
            poomsaeConfig: cat.poomsaeConfig,
            competitors: cat.competitors,
            pyramidMatches: cat.pyramidMatches || []
        }))
    };

    const data = JSON.stringify(exportData, null, 2);
    const fileName = `Export_Kalyo_${event.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    const uint8Array = new TextEncoder().encode(data);

    await saveFileToEventFolder(event.name, fileName, uint8Array);
};
