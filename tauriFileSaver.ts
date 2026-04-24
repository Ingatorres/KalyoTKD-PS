/**
 * tauriFileSaver.ts
 * 
 * Saves files using Tauri's native FS plugin.
 * Strategy: Always try Tauri first, fall back to browser download if it fails.
 * This avoids unreliable environment detection checks.
 */

const browserDownload = (data: Uint8Array, fileName: string): string => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    return `Descargado: ${fileName}`;
};

/**
 * Guarda un archivo en el Escritorio (o en targetDir si se provee).
 * Intenta Tauri nativo primero; si falla, descarga vía browser.
 */
export const tauriFileSave = async (data: Uint8Array, fileName: string, targetDir?: string): Promise<string | null> => {
    try {
        const { join } = await import('@tauri-apps/api/path');
        const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

        if (targetDir) {
            const filePath = await join(targetDir, fileName);
            await writeFile(filePath, data);
            return filePath;
        } else {
            await writeFile(fileName, data, { baseDir: BaseDirectory.Desktop });
            return `Escritorio/${fileName}`;
        }
    } catch (tauriError) {
        console.warn('Tauri FS no disponible, usando descarga del navegador:', tauriError);
        try {
            return browserDownload(data, fileName);
        } catch (browserError) {
            console.error('Error en descarga del navegador:', browserError);
            return null;
        }
    }
};

/**
 * Saves a file to a folder named after the event on the Desktop.
 * Creates the folder if it doesn't exist.
 * Falls back to browser download if Tauri FS is unavailable.
 */
export const saveFileToEventFolder = async (
    eventName: string,
    fileName: string,
    data: Uint8Array,
    targetDir?: string
): Promise<string | null> => {
    const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, '_');
    const folderName = sanitizedEventName;

    try {
        const { join } = await import('@tauri-apps/api/path');
        const { exists, mkdir, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

        if (targetDir) {
            const finalDir = await join(targetDir, folderName);
            const folderExists = await exists(finalDir);
            if (!folderExists) {
                await mkdir(finalDir, { recursive: true });
            }
            const filePath = await join(finalDir, fileName);
            await writeFile(filePath, data);
            alert(`Archivo guardado en:\n${filePath}`);
            return filePath;
        } else {
            // Save to Desktop/<eventFolder>/fileName
            const folderExists = await exists(folderName, { baseDir: BaseDirectory.Desktop });
            if (!folderExists) {
                await mkdir(folderName, { baseDir: BaseDirectory.Desktop, recursive: true });
            }
            await writeFile(`${folderName}/${fileName}`, data, { baseDir: BaseDirectory.Desktop });
            const savedPath = `Escritorio/${folderName}/${fileName}`;
            alert(`Archivo guardado en:\n${savedPath}`);
            return savedPath;
        }
    } catch (tauriError) {
        console.warn('Tauri FS no disponible, usando descarga del navegador:', tauriError);
        try {
            const result = browserDownload(data, fileName);
            alert(`Archivo descargado: ${fileName}`);
            return result;
        } catch (browserError) {
            console.error('Error en descarga:', browserError);
            alert('Error al guardar el archivo. Revisa la consola.');
            return null;
        }
    }
};
