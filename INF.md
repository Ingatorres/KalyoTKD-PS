# Informe de Progreso - KalyoTKD_PS

## ¿Qué estamos haciendo?
Estamos modernizando y profesionalizando el sistema de gestión de torneos de Poomsae y combate para Taekwondo, usando tecnologías de escritorio multiplataforma (Tauri + React + TypeScript). El objetivo es que el software sea robusto, portable y visualmente profesional, alineado con estándares de Material Design 3 y la identidad visual "Kalyo Connect".

## ¿Qué estamos tratando?
- **Transferencia de pirámides entre computadoras:** Exportar e importar estructuras de brackets (pirámides) en formato JSON portable, permitiendo cargar torneos en diferentes PCs sin duplicar categorías.
- **Prevención de duplicados:** Validación avanzada para evitar la creación de categorías repetidas en el sistema.
- **Exportación profesional de PDFs:** Generación de brackets en PDF con logos personalizados (evento, sistema, liga), formato carta, portada y visualización profesional.
- **Reordenamiento de combates:** Interfaz drag-and-drop para reordenar los enfrentamientos antes de iniciar la competencia.
- **Modernización visual:** Aplicación de Material Design 3, paleta extendida de 51 colores, tipografía Plus Jakarta Sans, iconografía Material Symbols y efectos visuales avanzados (glass morphism, gradientes, indicadores de estado en vivo, etc).

## ¿En qué vamos? (Estado actual)
- [x] **Exportación/importación de pirámides:** Funcionalidad completa, validación y UI de modales lista.
- [x] **Prevención de duplicados:** Lógica lista, integración en formularios pendiente.
- [x] **Exportación PDF profesional:** Generador avanzado de PDFs implementado, UI de configuración lista.
- [x] **Drag-and-drop de combates:** Componente funcional, integración visual en progreso.
- [x] **Modernización visual:**
  - Tailwind configurado con Material Design 3 y Plus Jakarta Sans.
  - Modales de importación/exportación y PDF restyleados.
  - Bracket moderno (Kalyo Connect) implementado, integración visual en curso.
- [x] **Servidor de desarrollo:** Corre sin errores, dependencias corregidas.

## Próximos pasos
- Integrar el bracket moderno en la visualización principal de pirámides.
- Terminar integración de validación de duplicados en la creación de categorías.
- Validar experiencia de usuario y detalles visuales en todos los flujos.
- Documentar el flujo de exportación/importación para usuarios finales.

---

# Detalle Técnico y Funcional (Extenso)

## 1. Arquitectura General

- **Frontend:** React 19 + TypeScript 5.8, Tailwind CSS 3.4, PostCSS, dark mode, tipografía Plus Jakarta Sans, iconos Material Symbols.
- **Backend/Runtime:** Tauri 2.x (Rust), acceso nativo a FS, SQLite embebido, IPC para comunicación UI <-> backend.
- **Persistencia:** SQLite, serialización de objetos complejos (categorías, matches, competidores) en columnas JSON.
- **Build:** Vite 6, Rollup, npm, multiplataforma (Windows, Linux, macOS).

## 2. Flujos Críticos

### 2.1 Exportación/Importación de Pirámides
- **Exportar:**
  - Selección de categorías de sistema "Pirámide".
  - Serialización a JSON con metadatos (versión, fecha, evento, categorías, matches, competidores).
  - Guardado en Desktop vía Tauri (buffer -> archivo .json).
- **Importar:**
  - Selección de archivo JSON.
  - Validación de estructura y compatibilidad (campos obligatorios, duplicados, poomsaes, matches, competidores).
  - Vista previa de categorías a importar y errores detectados.
  - Confirmación y merge: se agregan categorías nuevas con IDs únicos, sin sobrescribir existentes.

### 2.2 Validación de Duplicados
- **Algoritmo:**
  - Compara título, disciplina, modalidad, división, género, grupo de edad, grado/cinta, grupo de discapacidad.
  - Si todos los campos coinciden, se considera duplicado y se bloquea la creación/importación.
  - Mensajes de error claros en español.

### 2.3 Exportación PDF Profesional
- **Generador:** jsPDF 3.x + autotable.
- **Estructura:**
  - Portada con 3 logos (evento, sistema, liga), gradiente, datos del evento.
  - Página de competidores (opcional), tabla con nombre, delegación, posición.
  - Visualización de bracket por fases (Octavos, Cuartos, Semifinal, Final), tablas de matches, colores y tipografía MD3.
  - Pie de página con paginación y autor.
- **Configuración:** Modal con drag-drop de logos, nombre de autor, check para incluir lista de competidores.

### 2.4 Drag-and-Drop de Combates
- **Componente:** DraggablePyramidBracket (300+ líneas).
- **Funcionalidad:**
  - Permite arrastrar matches y soltar sobre otro para intercambiar competidores.
  - Feedback visual: opacidad, borde animado, pulso en match activo.
  - Agrupación por fases, soporte para "bye" (paso directo).

### 2.5 Modernización Visual
- **Tailwind:**
  - 51 colores MD3, clases personalizadas para glass morphism, gradientes, animaciones.
  - Tipografía Plus Jakarta Sans en todos los textos.
  - Iconografía Material Symbols (Google Fonts).
- **Componentes restyleados:**
  - PyramidImportModal, PyramidExportModal, BracketPdfExportModal, HomeScreen, ModernPyramidBracket.
  - Soporte completo para dark mode.

## 3. Estado del Código
- **Sin errores de compilación.**
- **Dependencias auditadas y corregidas.**
- **Servidor de desarrollo funcional en http://localhost:1420/**
- **Estructura de carpetas clara:**
  - /components (UI)
  - /src (lógica, assets)
  - /data (datos estáticos)
  - /public (archivos estáticos)
  - /src-tauri (backend Rust)

## 4. Pendientes y Siguientes Pasos
- Integrar ModernPyramidBracket en la pantalla principal de visualización de pirámides.
- Integrar validación de duplicados en CategoryScreen (formulario de creación).
- Pruebas de usuario y QA visual.
- Documentar flujos para usuarios finales (manual de uso, video tutorial).
- Mejorar feedback visual en errores y confirmaciones.

## 5. Glosario de Entidades
- **Evento:** Objeto raíz, contiene categorías, metadatos, fechas, responsables.
- **Categoría:** Define sistema (Pirámide, Rondas, Freestyle), reglas, competidores, matches.
- **PyramidMatch:** Objeto de combate, referencia a competidores blue/red, fase, estado, ganador.
- **Competidor:** Nombre, delegación, ID único, seed.
- **PyramidExportData:** Estructura JSON para exportación/importación.

---

**Este informe es lo suficientemente detallado para que cualquier desarrollador, IA o humano, pueda continuar el proyecto sin ambigüedades.**

**Responsable:** Equipo Kalyo Technology
**Fecha:** 23 de abril de 2026
