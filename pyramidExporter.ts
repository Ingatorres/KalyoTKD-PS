/**
 * pyramidExporter.ts
 * 
 * Export and import pyramid tournament structures as JSON
 * Enables cross-computer pyramid transfer without duplicating categories
 */

import { Event, Category, PyramidMatch, PoomsaeConfig } from './types';
import { tauriFileSave } from './tauriFileSaver';
import * as tauriUtils from './tauriUtils';

/**
 * Pyramid export structure for file interchange
 */
export interface PyramidExportData {
  version: string;
  exportDate: string;
  eventName: string;
  eventId: string;
  pyramidCategories: Array<{
    categoryId: string;
    categoryTitle: string;
    system: string;
    discipline: string;
    modality: string;
    division: string;
    gender: string;
    ageGroup: string;
    beltLevel: string;
    disabilityGroup?: string;
    poomsaeConfig: PoomsaeConfig;
    competitors: Array<{
      id: string;
      name: string;
      delegation: string;
      seedNumber?: number;
    }>;
    pyramidMatches: PyramidMatch[];
  }>;
}

/**
 * Export selected pyramid categories to JSON file
 * 
 * @param event - Event containing categories
 * @param categoryIds - Array of category IDs to export
 * @returns JSON export data
 */
export async function exportPyramidsToJson(
  event: Event,
  categoryIds: string[]
): Promise<PyramidExportData> {
  const pyramidCategories = event.categories
    ?.filter(
      cat =>
        cat.system === 'Pirámide' && categoryIds.includes(cat.id)
    )
    .map(cat => ({
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
    })) || [];

  return {
    version: '2.1.0',
    exportDate: new Date().toISOString(),
    eventName: event.name,
    eventId: event.id,
    pyramidCategories
  };
}

/**
 * Save pyramid export to file
 */
export async function savePyramidExport(
  exportData: PyramidExportData,
  fileName?: string,
  targetDir?: string
): Promise<void> {
  const defaultName = `${exportData.eventName}_Pyramids_${new Date()
    .toISOString()
    .split('T')[0]}.json`;
  
  const jsonString = JSON.stringify(exportData, null, 2);
  const buffer = new TextEncoder().encode(jsonString);
  
  await tauriFileSave(buffer, fileName || defaultName, targetDir);
}

/**
 * Import pyramid structure from JSON file
 * 
 * @param filePath - Path to JSON export file
 * @returns Parsed pyramid export data
 */
export async function importPyramidsFromJson(
  filePath: string
): Promise<PyramidExportData> {
  const fileContent = await tauriUtils.readTextFileContent(filePath);
  const importData: PyramidExportData = JSON.parse(fileContent);
  
  // Validate structure
  if (
    !importData.version ||
    !importData.eventName ||
    !importData.pyramidCategories ||
    !Array.isArray(importData.pyramidCategories)
  ) {
    throw new Error(
      'Archivo de importación inválido: estructura no reconocida'
    );
  }
  
  return importData;
}

/**
 * Validate import compatibility with existing event
 * 
 * @param importData - Data being imported
 * @param existingEvent - Existing event to merge with
 * @returns Array of validation errors (empty = valid)
 */
export function validatePyramidImport(
  importData: PyramidExportData,
  existingEvent: Event
): string[] {
  const errors: string[] = [];
  
  // Check for duplicate category titles
  if (existingEvent.categories) {
    const existingTitles = new Set(
      existingEvent.categories.map(c => c.title)
    );
    
    for (const importCat of importData.pyramidCategories) {
      if (existingTitles.has(importCat.categoryTitle)) {
        errors.push(
          `Categoría duplicada: "${importCat.categoryTitle}" ya existe en el evento`
        );
      }
    }
  }
  
  // Validate poomsae configuration
  for (const cat of importData.pyramidCategories) {
    if (!cat.poomsaeConfig.poomsaes || cat.poomsaeConfig.poomsaes.length === 0) {
      errors.push(
        `Categoría "${cat.categoryTitle}" no tiene poomsaes asignadas`
      );
    }
    
    if (cat.competitors.length === 0) {
      errors.push(
        `Categoría "${cat.categoryTitle}" no tiene competidores`
      );
    }
    
    if (!cat.pyramidMatches || cat.pyramidMatches.length === 0) {
      errors.push(
        `Categoría "${cat.categoryTitle}" no tiene estructura de pírámide`
      );
    }
  }
  
  return errors;
}

/**
 * Merge imported categories into existing event
 * 
 * @param importData - Imported pyramid data
 * @param targetEvent - Target event to receive categories
 * @returns Updated event with merged categories
 */
export function mergePyramidImport(
  importData: PyramidExportData,
  targetEvent: Event
): Event {
  const updatedEvent = { ...targetEvent };
  
  if (!updatedEvent.categories) {
    updatedEvent.categories = [];
  }
  
  // Add imported categories with new IDs
  const newCategories = importData.pyramidCategories.map(importCat => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}-${Math.random()}`;
    
    return {
      id: newId,
      title: importCat.categoryTitle,
      system: importCat.system as any,
      discipline: importCat.discipline,
      modality: importCat.modality,
      division: importCat.division,
      gender: importCat.gender,
      ageGroup: importCat.ageGroup,
      beltLevel: importCat.beltLevel,
      disabilityGroup: importCat.disabilityGroup,
      poomsaeConfig: importCat.poomsaeConfig,
      competitors: importCat.competitors,
      pyramidMatches: importCat.pyramidMatches,
      scores: [],
      status: 'pending' as const
    } as Category;
  });
  
  updatedEvent.categories.push(...newCategories);
  
  return updatedEvent;
}
