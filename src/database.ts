
import Database from "@tauri-apps/plugin-sql";
import { Event, Category } from '../types';

// Carga la base de datos y la mantiene en una promesa para que no se cargue múltiples veces.
const dbInstance = Database.load("sqlite:kalyo_events.db");

/**
 * Obtiene la instancia única de la base de datos.
 * @returns {Promise<Database>} Una promesa que se resuelve con la instancia de la base de datos.
 */
export async function getDb(): Promise<Database> {
    return await dbInstance;
}

/**
 * Inicializa la base de datos, creando las tablas necesarias si no existen.
 * Esta función debe ser llamada una vez al inicio de la aplicación.
 */
export async function initDb() {
    const db = await getDb();

    // Esquema de la base de datos.
    // Se utiliza TEXT para los campos que contienen objetos JSON serializados,
    // lo que nos permite una migración más directa desde la estructura de localStorage.
    await db.execute(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            areaNumber INTEGER NOT NULL,
            areaChief TEXT NOT NULL,
            registrarName TEXT NOT NULL,
            judges TEXT, -- JSON array of Judge objects
            status TEXT NOT NULL
        );
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            title TEXT NOT NULL,
            discipline TEXT,
            modality TEXT,
            division TEXT,
            gender TEXT,
            ageGroup TEXT,
            beltLevel TEXT,
            disabilityGroup TEXT,
            system TEXT,
            status TEXT,
            round TEXT,
            poomsaeConfig TEXT, -- JSON PoomsaeConfig object
            competitors TEXT, -- JSON array of Competitor objects
            pyramidMatches TEXT, -- JSON array of PyramidMatch objects
            scores TEXT, -- JSON array of CompetitorScore objects
            qualifiedCompetitorIds TEXT, -- JSON array of strings
            FOREIGN KEY (event_id) REFERENCES events (id)
        );
    `);

    console.log("Base de datos inicializada correctamente.");
}


/**
 * Guarda (inserta o reemplaza) un evento completo en la base de datos.
 * Las categorías se guardan por separado.
 * @param {Event} event El objeto de evento a guardar.
 */
export async function saveEvent(event: Event) {
    const db = await getDb();
    await db.execute(`
        INSERT OR REPLACE INTO events (id, name, date, areaNumber, areaChief, registrarName, judges, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            event.id,
            event.name,
            event.date,
            event.areaNumber,
            event.areaChief,
            event.registrarName,
            JSON.stringify(event.judges),
            event.status
        ]
    );
    // Guardar cada categoría asociada al evento
    for (const category of event.categories) {
        await saveCategory(category, event.id);
    }
}

/**
 * Guarda (inserta o reemplaza) una categoría en la base de datos.
 * @param {Category} category El objeto de categoría a guardar.
 * @param {string} eventId El ID del evento al que pertenece la categoría.
 */
export async function saveCategory(category: Category, eventId: string) {
    const db = await getDb();
    await db.execute(
        `INSERT OR REPLACE INTO categories (id, event_id, title, discipline, modality, division, gender, ageGroup, beltLevel, disabilityGroup, system, status, round, poomsaeConfig, competitors, pyramidMatches, scores, qualifiedCompetitorIds)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
            category.id,
            eventId,
            category.title,
            category.discipline,
            category.modality,
            category.division,
            category.gender,
            category.ageGroup,
            category.beltLevel,
            category.disabilityGroup,
            category.system,
            category.status,
            category.round,
            JSON.stringify(category.poomsaeConfig),
            JSON.stringify(category.competitors),
            JSON.stringify(category.pyramidMatches),
            JSON.stringify(category.scores),
            JSON.stringify(category.qualifiedCompetitorIds)
        ]
    );
}

/**
 * Recupera todos los eventos y sus categorías de la base de datos.
 * @returns {Promise<Event[]>} Una promesa que se resuelve con un array de eventos.
 */
export async function getEvents(): Promise<Event[]> {
    const db = await getDb();
    const eventRows: any[] = await db.select('SELECT * FROM events');
    
    const events: Event[] = [];

    for (const eventRow of eventRows) {
        const categoryRows: any[] = await db.select('SELECT * FROM categories WHERE event_id = $1', [eventRow.id]);
        
        const categories: Category[] = categoryRows.map(catRow => ({
            ...catRow,
            poomsaeConfig: JSON.parse(catRow.poomsaeConfig || '{}'),
            competitors: JSON.parse(catRow.competitors || '[]'),
            pyramidMatches: JSON.parse(catRow.pyramidMatches || '[]'),
            scores: JSON.parse(catRow.scores || '[]'),
            qualifiedCompetitorIds: JSON.parse(catRow.qualifiedCompetitorIds || '[]')
        }));

        events.push({
            ...eventRow,
            judges: JSON.parse(eventRow.judges || '[]'),
            categories: categories
        });
    }

    return events;
}


