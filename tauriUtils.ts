import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { PdiPayload } from './types';
import { listen } from '@tauri-apps/api/event';

const PDI_STORAGE_KEY = 'kalyo-pdi-payload';

/**
 * Detects if the current environment is Tauri desktop.
 */
const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

/**
 * Trae la ventana de la Pantalla Pública al frente.
 */
export async function focusPdi() {
  try {
    const pdiWindow = await Window.getByLabel('public');
    if (pdiWindow) {
      await pdiWindow.setFocus();
    }
  } catch (e) {
    console.error("Failed to focus PDI window", e);
  }
}

/**
 * Actualiza el contenido de la Pantalla Pública enviando datos a través de localStorage
 * y también via Tauri events para garantizar la sincronización entre ventanas.
 */
export async function updatePdi(payload: PdiPayload) {
  try {
    localStorage.setItem(PDI_STORAGE_KEY, JSON.stringify(payload));

    // Also emit a Tauri event so that the PDI window (which may be in the same
    // WebView process and therefore never receives the 'storage' DOM event) can
    // react immediately.
    if (isTauri()) {
      try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('kalyo-pdi-update', payload);
      } catch (emitErr) {
        // If Tauri emit fails (e.g., in browser dev mode), fall through.
        // The PDI will poll localStorage as a fallback.
        console.warn('Tauri emit failed, PDI will rely on localStorage polling', emitErr);
      }
    } else {
      // In browser/dev mode, dispatch a custom event so the PDI tab picks it up
      // via the storage event or a custom listener.
      window.dispatchEvent(new StorageEvent('storage', {
        key: PDI_STORAGE_KEY,
        newValue: JSON.stringify(payload),
      }));
    }
  } catch (e) {
    console.error("Failed to updatePdi", e);
  }
}

interface ScorePayload {
  judgeIndex: number;
  technical: number;
  presentation: number;
}

/**
 * Listens for score updates from the judge controllers via Tauri events.
 * @param handler The function to call when a score update is received.
 * @returns A promise that resolves to a function to stop listening.
 */
export async function listenForScores(handler: (payload: ScorePayload) => void): Promise<() => void> {
  if (!isTauri()) return () => {}; // No-op if not in Tauri
  try {
    const unlisten = await listen<ScorePayload>('score-update', (event) => {
      handler(event.payload);
    });
    return unlisten;
  } catch (e) {
    console.error("Failed to set up score listener", e);
    return () => {}; // Return a no-op function on error
  }
}

/**
 * Opens a file dialog to select a CSV file and returns its content.
 * Returns null if not in a Tauri environment or if the user cancels.
 * @returns A promise that resolves to the file content as a string, or null.
 */
export async function importCsvFile(): Promise<string | null> {
  if (!isTauri()) {
    alert('La importación de archivos solo está disponible en la aplicación de escritorio.');
    return null;
  }
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (typeof selected === 'string') {
      return await readTextFile(selected);
    }
    return null;
  } catch (e) {
    console.error('Error importing file:', e);
    return null;
  }
}

/**
 * Opens a file dialog to select a file with specific extension
 * @param extension File extension to filter by (e.g., '.json', '.csv')
 * @returns File path as string, or null if cancelled
 */
export async function selectFile(extension: string): Promise<string | null> {
  if (!isTauri()) {
    alert('La selección de archivos solo está disponible en la aplicación de escritorio.');
    return null;
  }
  try {
    const ext = extension.replace('.', '');
    const selected = await open({
      multiple: false,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });

    if (typeof selected === 'string') {
      return selected;
    }
    return null;
  } catch (e) {
    console.error(`Error selecting ${extension} file:`, e);
    return null;
  }
}

/**
 * Read text file from Tauri file system
 */
export async function readTextFileContent(path: string): Promise<string> {
  return await readTextFile(path);
}

/**
 * Opens a dialog to select a directory for exporting files
 * @returns Directory path as string, or null if cancelled
 */
export async function selectExportDirectory(): Promise<string | null> {
  if (!isTauri()) {
    alert('La selección de carpetas solo está disponible en la aplicación de escritorio.');
    return null;
  }
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (typeof selected === 'string') {
      return selected;
    }
    return null;
  } catch (e) {
    console.error(`Error selecting directory:`, e);
    return null;
  }
}

