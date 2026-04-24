# KalyoTKD Poomsaes - Enciclopedia de Arquitectura, Vistas y UX/UI

Este documento es la **fuente de verdad absoluta** para la arquitectura visual, diseño de experiencia de usuario (UX/UI) y flujos de datos de KalyoTKD Poomsaes. Detalla el sistema dual de pantallas: **Consola del Registrador** (Dashboard Administrativo) y la **Interfaz de Visualización Pública (PDI)** (Para público y jueces).

---

## 🎨 1. Sistema de Diseño Global y Tematización

La aplicación utiliza un sistema bimodal altamente especializado para reducir la fatiga visual del registrador y maximizar el impacto visual para el espectador.

### 1.1. Light Minimalist Premium (Consola del Registrador)
**Objetivo:** Claridad absoluta, prevención de errores por fatiga visual y lectura rápida de datos (cientos de competidores).
- **Fondos:** `bg-gray-50` para el contenedor principal, `bg-white` para las tarjetas. En modo oscuro, usa `bg-[#0e1424]` y `bg-slate-800`.
- **Bordes:** Finos y sutiles (`border-gray-200` o `border-slate-700`).
- **Estados:**
    - Éxito/Activo: Verde Esmeralda (`bg-emerald-500`).
    - Pendiente/Configuración: Azul o Púrpura (`bg-blue-600`).
    - Alertas/Pausas: Naranja/Ámbar (`bg-amber-500`).
    - Destructivo: Rojo (`bg-red-600`).

### 1.2. Kinetic Arena (PDI - Public Display Interface)
**Objetivo:** Estética televisiva, intensidad emocional, contraste máximo para legibilidad a larga distancia (proyectores y televisores).
- **Fondos:** Profundos `bg-black`, combinados con degradados radiales y *Glassmorphism* (`backdrop-blur-2xl`, `bg-black/40`).
- **Glow & Neón:** Uso intensivo de sombras proyectadas (`drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]` y `shadow-blue-500/80`) para simular luces de arena.
- **Tipografía:** Tamaños colosales (`text-7xl` a `text-9xl`), pesos extremos (`font-black`), y *tracking* ajustado (`tracking-tighter` para números, `tracking-widest` para etiquetas).
- **Micro-interacciones:** `animate-pulse`, `animate-slide-up`, `animate-zoom-in` para revelar puntajes y ganadores.

---

## 🛠️ 2. Flujo y Vistas del Registrador (Main App)

Cada vista del registrador está diseñada para evitar "callejones sin salida" y guiar al usuario a través del protocolo oficial de Taekwondo WT.

### 2.1. HomeScreen (Creación de Eventos)
- **Ruta/Componente:** `HomeScreen.tsx`
- **Descripción:** Punto de entrada. Formulario limpio y centrado.
- **Campos:** Nombre del Torneo, Fecha, Registrador responsable, Número de Área (importante para PDI), y Nombre del Jefe de Área.
- **UX:** Validaciones estrictas. Botón central que activa la transición al Dashboard.

### 2.2. EventDashboard (Centro de Mando)
- **Ruta/Componente:** `EventDashboard.tsx`
- **Descripción:** Tablero de control de las Categorías.
- **Layout:** Grid de tarjetas. Cada tarjeta representa una categoría y muestra etiquetas visuales de su estado (Pendiente, En curso, Finalizado).
- **Interacciones:**
    - Crear nueva categoría (Botón de acción flotante / Card "Nueva Categoría").
    - Reanudar categoría (Si fue pausada).
    - Ver resultados finales.

### 2.3. CategoryScreen (Configuración de la Categoría)
- **Ruta/Componente:** `CategoryScreen.tsx`
- **Descripción:** Constructor paramétrico. Define las reglas del juego.
- **Lógica Específica:**
    - **Regla de Oro:** Evita categorías duplicadas evaluando las combinaciones (Modalidad, Edad, Cinturón, Género).
    - **Siembra de Favoritos (Ranking):** Al importar competidores desde Excel o CSV, el sistema asume inteligentemente que los **dos primeros registros** son los mejores rankeados (Seed 1 y Seed 2). El algoritmo matemático de la pirámide los ubicará forzosamente en los extremos opuestos del bracket para garantizar que solo puedan enfrentarse en una hipotética final.
    - **Modalidades (Crucial):** Si el usuario elige "Parejas", "Equipos" o "Tríos", la lógica del PDI cambiará automáticamente su comportamiento de visualización (Ver sección 3).
    - **Ingreso de Competidores:** Soporta tipeo manual o pegado masivo desde Excel. Si es *Equipo/Pareja*, el Registrador escribe los 3 nombres separados por comas en "Nombre" y el país/club en "Delegación".

### 2.4. PoomsaeConfigScreen (Sorteos y Árboles)
- **Ruta/Componente:** `PoomsaeConfigScreen.tsx`
- **Descripción:** Aquí se generan los cruces y se sortean los Poomsaes.
- **Sorteador UI:** Interfaz estilo "rueda de la fortuna" / tragamonedas que cicla nombres de poomsaes antes de detenerse (aporta transparencia).
- **Flujo Inteligente (Empezar Pirámide Automático):** Una vez generada la llave, el registrador cuenta con el botón "Empezar Pirámide Automático". Este botón escanea el árbol, encuentra el primer combate disponible (con ambos atletas listos y sin ganador) y lo lanza directamente a la pista sin que el registrador deba tipear o buscar nombres manualmente.
- **Llaves / Bracket:** Renderiza visualmente el árbol de eliminación usando SVG Lines (bezier curves). Permite a los jueces ver la estructura antes de imprimir.
- **Exportación de Pirámides (BracketPdfExportModal):**
    - Modalidad nativa para imprimir reportes gráficos (sin Excel).
    - Remueve emojis, usa SVGs.
    - Exporta a tamaño Carta (8.5x11") con jsPDF y autoTable.
    - Soporta la carga de logos (Evento, Liga).

### 2.5. CompetitionScreen (Consola de Jueces)
- **Ruta/Componente:** `CompetitionScreen.tsx`
- **Descripción:** El "motor" durante los combates.
- **Inputs Numéricos de Alta Precisión (`ScoreInput.tsx`):** Un componente vital. Acepta teclados de cualquier idioma. Automáticamente intercepta comas `,` y las transforma en puntos decimales `.`, evitando que el NaN rompa la competencia si un juez español o latino digita rápido.
- **Acciones PDI:** Todo botón que muta el estado (Puntuar, Declarar Ganador) dispara un `updatePdi` que serializa un JSON (`PdiPayload`) y lo empuja a través de `localStorage` (`tauriUtils.ts`) en < 0.5 ms.

### 2.6. ResultsViewerScreen
- **Ruta/Componente:** `ResultsViewerScreen.tsx`
- **Descripción:** Cierre de la categoría. Tabla de posiciones. Permite exportar a Excel la clasificación final.

---

## 📺 3. Vistas del PDI (Public Display Interface)

El PDI escucha pasivamente eventos de `storage` en `window`. Si la llave `PDI_EVENT` cambia, lee el Payload y re-renderiza a 60fps. Cero recargas de página.

### 3.1. Adaptabilidad Inteligente (Módulo Equipos vs Individual)
**La lógica más avanzada del PDI.** En `types.ts`, todos los *Payloads* (LiveData, WinnerData, FinalResultsData) incluyen un campo opcional `modality`.
- **Comportamiento Individual:** El Nombre del competidor (ej. *John Doe*) es el Título Gigante Principal. La Delegación (ej. *USA*) es el subtítulo pequeño.
- **Comportamiento Equipos/Parejas:** Si `modality` contiene las palabras "equipo", "pareja" o "trio", **El PDI invierte la jerarquía visual.** La Delegación (ej. *USA Nacional Team*) se vuelve el Título Gigante, y los nombres de los 3 atletas (*John, Mark, Luke*) se vuelven el subtítulo, garantizando que el público sepa qué país/club está compitiendo.

### 3.2. IdleScreen (Espera)
- **Componente:** `IdleScreen.tsx`
- Fondo negro puro con un spinner o un latido de opacidad leve. Previene el quemado de pantallas OLED.

### 3.3. PyramidLiveScreen (Combate en Vivo)
- **Componente:** `PyramidLiveScreen.tsx`
- **Estructura:** Pantalla dividida simétricamente. 50% Izquierda (HONG - Rojo), 50% Derecha (CHONG - Azul).
- **Colores:** Gradientes intensos `from-red-500 to-red-700` y `from-blue-500 to-blue-700`.
- **Datos:** Muestra los Promedios de Técnica, Presentación y el Puntaje Total Final con fuentes masivas y sombras (`drop-shadow-md`). Usa la lógica de Equipos (3.1) para invertir títulos automáticamente.

### 3.4. PyramidWinnerScreen (Cinemática de Ganador)
- **Componente:** `PyramidWinnerScreen.tsx`
- **Fase 1 (Tensión 3s):** Pantalla oscurecida. Anillos tricolores rotando velozmente. Texto: "PROCESANDO DECISIÓN". (Construye hype en las gradas).
- **Fase 2 (Explosión):** Inundación de luz (Spotlight) Azul o Roja.
    - Se revela el Ganador (Aplica la inversión de títulos de Equipos/Parejas).
    - Se muestra el desglose final exacto debajo del nombre (Técnica / Puntaje Total / Presentación) para justificar la victoria al público de forma transparente.

### 3.5. PyramidFinalResultsScreen (Podio y Medallas)
- **Componente:** `PyramidFinalResultsScreen.tsx`
- **Diseño:** Fondo oscuro con partículas borrosas y gradientes (Efecto "Blob" flotante animado en CSS).
- **Animaciones CSS:** Cascade Slide-up (`animate-slide-up-delayed`). Entra Plata (izq), luego el Oro rompe el centro escalado a 110%, y finalmente los dos Bronces (esquinas).
- **Manejo de Errores (Optional Chaining):** Si hay una categoría donde solo compitieron 2 personas, el PDI no crashea buscando al 3ro. Se usa `?.name` y `?.delegation`.
- **Lógica de Títulos:** También aplica la regla de Equipos/Parejas en las medallas, asegurando consistencia.

### 3.6. ErrorBoundary y Fallback System
- **Componente:** `ErrorBoundary.tsx` encapsulando `PublicDisplayApp`.
- **Objetivo:** Si ocurre una excepción de React o un `TypeError` inesperado por datos corruptos, el PDI intercepta el error.
- **Visual:** Muestra una pantalla negra con borde rojo de advertencia y un mensaje técnico indicando pulsar `Ctrl+R` en lugar de una pantalla blanca en blanco ("White Screen of Death"), salvando el evento en vivo.

---
**Fin de la Enciclopedia KalyoTKD.**  
*Todo flujo de datos, regla de negocio visual y arquitectura de interfaz gráfica ha sido debidamente documentada para su mantenimiento perpetuo y escalabilidad futura.*
