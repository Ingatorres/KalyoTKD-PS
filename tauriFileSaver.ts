/**
 * Guarda un archivo en una ubicación específica o en el escritorio por defecto.
 * @param data Uint8Array o Buffer de datos
 * @param fileName Nombre del archivo (ej: "export.json")
 * @param targetDir Directorio destino opcional. Si no se provee, usa Desktop.
 * @returns Ruta absoluta donde se guardó el archivo, o null si error
 */
export const tauriFileSave = async (data: Uint8Array, fileName: string, targetDir?: string): Promise<string | null> => {
    // @ts-ignore
    if (window.__TAURI__) {
        try {
            const { BaseDirectory, join, homeDir } = await import('@tauri-apps/api/path');
            const { writeFile } = await import('@tauri-apps/plugin-fs');

            if (targetDir) {
                const absolutePath = await join(targetDir, fileName);
                await writeFile(absolutePath, data);
                return absolutePath;
            } else {
                // Escribir archivo en Desktop
                await writeFile(fileName, data, { baseDir: BaseDirectory.Desktop });
                // Ruta absoluta para feedback
                const absolutePath = await join(await homeDir(), 'Desktop', fileName);
                return absolutePath;
            }
        } catch (error) {
            console.error('Error saving file:', error);
            return null;
        }
    } else {
        // Fallback for browser
        try {
            const blob = new Blob([data], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            return 'Descargado en el navegador';
        } catch (error) {
            console.error('Error downloading file in browser:', error);
            return null;
        }
    }
};

/**
 * Saves a file to a folder named after the event.
 * Creates the folder if it doesn't exist.
 * @param eventName The name of the event (used for folder name).
 * @param fileName The name of the file to save (e.g., "Results.xlsx").
 * @param data The file data as a Uint8Array.
 * @param targetDir Optional target directory. Defaults to Desktop.
 * @returns The full path where the file was saved, or null if error.
 */
export const saveFileToEventFolder = async (eventName: string, fileName: string, data: Uint8Array, targetDir?: string): Promise<string | null> => {
    // @ts-ignore
    if (window.__TAURI__) {
        try {
            const { BaseDirectory, join, homeDir } = await import('@tauri-apps/api/path');
            const { exists, mkdir, writeFile } = await import('@tauri-apps/plugin-fs');

            // Sanitize event name for folder usage
            const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, '_');
            const folderName = sanitizedEventName;

            if (targetDir) {
                const finalDir = await join(targetDir, folderName);
                const folderExists = await exists(finalDir);
                if (!folderExists) {
                    await mkdir(finalDir, { recursive: true });
                }
                const filePath = await join(finalDir, fileName);
                await writeFile(filePath, data);
                return filePath;
            } else {
                const folderPath = `${folderName}`;
                const folderExists = await exists(folderPath, { baseDir: BaseDirectory.Desktop });
                if (!folderExists) {
                    await mkdir(folderPath, { baseDir: BaseDirectory.Desktop, recursive: true });
                }
                const filePath = await join(folderPath, fileName);
                await writeFile(filePath, data, { baseDir: BaseDirectory.Desktop });
                
                const absolutePath = await join(await homeDir(), 'Desktop', folderPath, fileName);
                return absolutePath;
            }
        } catch (error) {
            console.error("Error saving file to event folder:", error);
            return null;
        }
    } else {
        // Fallback for browser
        return null; // The caller (excelExporter) handles browser blob downloads on null/failure or checks window.__TAURI__ first.
    }
};

