/**
 * categoryValidator.ts
 * 
 * Validates category creation to prevent duplicates
 */

import { Category, Event } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate if a category already exists in the event
 * Checks: title, discipline, modality, division, gender, ageGroup, beltLevel
 */
export function validateCategoryUniqueness(
  newCategory: Category,
  existingCategories: Category[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  const duplicateCategory = existingCategories.find(
    existing =>
      existing.title === newCategory.title &&
      existing.discipline === newCategory.discipline &&
      existing.modality === newCategory.modality &&
      existing.division === newCategory.division &&
      existing.gender === newCategory.gender &&
      existing.ageGroup === newCategory.ageGroup &&
      existing.beltLevel === newCategory.beltLevel &&
      existing.disabilityGroup === newCategory.disabilityGroup
  );

  if (duplicateCategory) {
    errors.push({
      field: 'category',
      message: `Esta categoría ya existe en el evento: "${newCategory.title}". 
      No se puede crear la misma categoría dos veces. 
      Sistema: ${duplicateCategory.system} | Estado: ${duplicateCategory.status}`
    });
  }

  return errors;
}

/**
 * Validate complete category data
 */
export function validateCategory(
  category: Category,
  existingCategories?: Category[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!category.title || category.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'El título de la categoría es requerido' });
  }

  if (!category.discipline) {
    errors.push({ field: 'discipline', message: 'La disciplina es requerida' });
  }

  if (!category.system) {
    errors.push({ field: 'system', message: 'El sistema de competencia es requerido' });
  }

  if (!category.competitors || category.competitors.length === 0) {
    errors.push({ field: 'competitors', message: 'Se requiere al menos un competidor' });
  }

  // For Pirámide system
  if (category.system === 'Pirámide') {
    if (!category.pyramidMatches || category.pyramidMatches.length === 0) {
      errors.push({ field: 'pyramidMatches', message: 'Estructura de pírámide no configurada' });
    }
  }

  // Check for duplicates if existing categories provided
  if (existingCategories && existingCategories.length > 0) {
    const uniquenessErrors = validateCategoryUniqueness(category, existingCategories);
    errors.push(...uniquenessErrors);
  }

  return errors;
}

/**
 * Check if a category title is already in use
 */
export function isCategoryTitleDuplicate(
  title: string,
  existingCategories: Category[]
): boolean {
  return existingCategories.some(cat => cat.title === title);
}

/**
 * Get human-readable validation error message
 */
export function getValidationErrorMessage(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }

  return `Se encontraron ${errors.length} errores de validación:\n${errors
    .map((e, i) => `${i + 1}. ${e.message}`)
    .join('\n')}`;
}

/**
 * Validation helper for UI
 */
export function validateBeforeCreatingCategory(
  newCategory: Category,
  event: Event
): { isValid: boolean; errors: ValidationError[] } {
  const allErrors = validateCategory(
    newCategory,
    event.categories || []
  );

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}
