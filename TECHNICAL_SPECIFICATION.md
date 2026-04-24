# KALYO TKD POOMSAES SCORING - TECHNICAL SPECIFICATION REPORT

**Document Version**: 2.1.0  
**Generation Date**: April 23, 2026  
**Scope**: Complete architectural, functional, and technical analysis of the Kalyo TKD Poomsaes Scoring System

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview

**Kalyo TKD - Poomsaes Scoring** is a professional-grade desktop application engineered for real-time management of Taekwondo (WT standards) competition point-scoring across three distinct modalities:

- **Rondas** (Qualification + Finals progression system)
- **Pirámide** (Single/Double-elimination bracket tournament format)
- **Freestyle** (Presentation-based judging with technical + presentation scoring)

### 1.2 Core Objectives

```
Primary Objective: Real-time synchronized scoring for competitive Taekwondo events
Secondary Objectives:
├─ Implement WTA-compliant scoring algorithms (judge averaging with discard logic)
├─ Provision dual-display architecture (Registrador + PDI)
├─ Enable offline-first operation with SQLite persistence
├─ Generate exportable reports (Excel/PDF) with event statistics
└─ Provide licensing/activation mechanism with date-based expiration
```

### 1.3 Key Metrics

| Metric | Value |
|--------|-------|
| **Codebase Size** | ~15,000 LOC (TypeScript/React/Rust) |
| **Component Count** | 30+ React components (8 main + 14 PDI + 8 utility) |
| **Database Schema** | 2 primary tables (events, categories) + JSON serialization |
| **PDI Views** | 14 distinct display screens |
| **Competition Systems** | 3 core algorithms (Rondas, Pirámide, Freestyle) |
| **Supported Judges** | 3, 5, 7 concurrent scoring (W.T. standards) |
| **Export Formats** | Excel (.xlsx), PDF (.pdf) |
| **Platform Support** | Windows, macOS, Linux (via Tauri) |

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend Layer

```yaml
Framework:
  Library: React 19.1.0
  TypeScript: 5.8.0 (strict mode enabled)
  State Management: React Hooks + localStorage
  
Styling:
  CSS Framework: Tailwind CSS 3.4.0
  Preprocessor: PostCSS 8.x
  Dark Mode: CSS class-based toggle
  Font System: Inter (local, offline)
  
Build Tooling:
  Module Bundler: Vite 6.2.0
  Entry Points: Dual (index.html + public.html)
  Output: ESM modules with code splitting
  HMR: Enabled for dev workflow
```

### 2.2 Backend/Runtime

```yaml
Desktop Framework:
  Runtime: Tauri 2.x (Rust)
  Window Management: Native OS windows
  File System Access: Tauri FS plugin
  IPC Protocol: Tauri invoke/listen
  
Database:
  Engine: SQLite (embedded)
  Tauri Plugin: @tauri-apps/plugin-sql
  Schema: 2 primary tables + JSON columns
  Persistence: File-based (.sqlite)
  Transactions: ACID-compliant
```

### 2.3 Build & Deployment

```yaml
Development:
  Package Manager: npm 9+
  Dev Server: Vite (localhost:1420)
  Watch Mode: Enabled
  Source Maps: Development quality
  
Production:
  Build Output: dist/ directory
  Bundling: Rollup (via Vite)
  Optimization: Tree-shaking, code minification
  Tauri Build: Cross-platform executable generation
  Output Formats:
    - Windows: .msi installer (NSIS)
    - macOS: .dmg package
    - Linux: .AppImage or .deb
```

### 2.4 Key Dependencies (Production)

```json
Core UI:
  - react@19.1.0
  - react-dom@19.1.0
  - typescript@5.8.0
  
Styling & Animation:
  - tailwindcss@3.4.0
  - postcss@8.x
  
Data Export:
  - exceljs@4.4.0 (Excel generation)
  - jspdf@3.0.0 (PDF generation)
  - jspdf-autotable@3.5.0 (tabular PDF data)
  
Data Import:
  - papaparse@5.5.0 (CSV parsing)
  
Utilities:
  - uuid@11.1.0 (ID generation)
  - dnd-kit@6.3.0 (drag-n-drop)
  
Tauri Integration:
  - @tauri-apps/api@1.5.x
  - @tauri-apps/plugin-sql@1.x
  - @tauri-apps/plugin-fs@1.x
```

---

## 3. ARCHITECTURAL DESIGN

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    KALYO TKD POOMSAES SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TAURI RUNTIME (Rust)                       │
│  ┌─ Filesystem API (Save/Load) ──┐  ┌─ SQLite Driver ─────┐   │
│  │ tauriFileSaver.ts invokes      │  │ src/database.ts    │   │
│  │ Rust command execution         │  │ Database operations │   │
│  └────────────────────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    ↓↑ (IPC / Tauri invoke)
┌─────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT TREE                         │
│                                                                 │
│  Window A: MAIN APP (index.html)                               │
│  ├─ App.tsx (root container)                                  │
│  ├─ SplashScreen (3s init)                                    │
│  ├─ ActivationScreen (license check)                          │
│  ├─ HomeScreen (navigation hub)                               │
│  ├─ NewEventScreen (event creation)                           │
│  ├─ CategoryScreen (category management)                      │
│  ├─ PoomsaeConfigScreen (competitor import)                   │
│  ├─ CompetitionScreen (scoring nucleus)                       │
│  │  ├─ PyramidLiveScoring (pyramid scores)                    │
│  │  ├─ FreestyleScoring (freestyle scores)                    │
│  │  ├─ RoundsCompetitorList (rounds list)                     │
│  │  └─ ScoreInput modal (judge input)                         │
│  ├─ ResultsViewer (final rankings)                            │
│  └─ ExistingEventsScreen (history)                            │
│                                                                 │
│  Window B: PUBLIC DISPLAY (public.html)                        │
│  └─ PublicDisplayApp.tsx (view dispatcher)                    │
│     └─ 14 PDI Views (conditional rendering)                   │
│        ├─ IDLE                                                 │
│        ├─ PYRAMID_LIVE                                         │
│        ├─ PYRAMID_WINNER / PYRAMID_FINAL_RESULTS              │
│        ├─ PYRAMID_BRACKET                                      │
│        ├─ ROUNDS_LIVE                                          │
│        ├─ ROUNDS_RESULTS / ROUNDS_FINALISTS                    │
│        ├─ FREESTYLE_PRESENTATION                               │
│        ├─ TECHNICAL_TIE                                        │
│        ├─ POOMSAE_DRAW / COMPETITION_START                     │
│        └─ [others...]                                          │
└─────────────────────────────────────────────────────────────────┘
        ↓↑ (localStorage bridge via StorageEvent)
┌─────────────────────────────────────────────────────────────────┐
│                  PERSISTENT DATA LAYER                          │
│                                                                 │
│  Session State (localStorage):                                 │
│  ├─ kalyo-tkd-current-event (Event ID)                        │
│  ├─ kalyo-tkd-current-category (Category ID)                  │
│  ├─ kalyo-tkd-current-match (Match ID - pyramid)              │
│  ├─ kalyo-pdi-payload (PDI view state)                        │
│  └─ kalyo-tkd-expiration (License date)                       │
│                                                                 │
│  Permanent Data (SQLite):                                      │
│  ├─ TABLE: events                                              │
│  │  ├─ id, name, date, areaNumber, areaChief, registrarName   │
│  │  ├─ judges (JSON), status (active|completed)               │
│  │  └─ ...metadata...                                          │
│  │                                                              │
│  └─ TABLE: categories                                          │
│     ├─ id, event_id (FK), title, system (Rondas|Pirámide)    │
│     ├─ competitors (JSON), pyramidMatches (JSON)              │
│     ├─ scores (JSON), status (pending|active|completed)       │
│     ├─ qualifiedCompetitorIds (JSON), poomsaeConfig (JSON)    │
│     └─ ...metadata...                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Architecture

```
MAIN APP SCORING LOOP:
┌────────────────────────┐
│  CompetitionScreen     │ ← Active category + system selected
└────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  Render Scoring Interface              │
│  (PyramidLiveScoring / Rounds list)    │
└────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  User enters scores → ScoreInput modal  │
│  Technical + Presentation values       │
└────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  calculateCompetitorFinalScore()       │
│  ├─ calculateAverage(techScores)       │
│  ├─ calculateAverage(presScores)       │
│  └─ return tech_avg + pres_avg        │
└────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  Update React state + localStorage     │
│  setScores([...updated scores])        │
│  localStorage['kalyo-pdi-payload'] ←   │
└────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  Save to SQLite (category record)      │
│  saveCategory(category, eventId)       │
└────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  PDI App detects StorageEvent          │
│  Listener triggers useEffect           │
│  Renders new view with latest data     │
└────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────┐
│  PUBLIC DISPLAY (TV/Projector)         │
│  Shows live scoring in real-time       │
└────────────────────────────────────────┘
```

### 3.3 Component Responsibility Matrix

```typescript
// MAIN APP SCREENS (8 primary)
SplashScreen          → Initialization (3s), activation check
ActivationScreen      → License validation (hardcoded: "KalyoTkd@2025")
HomeScreen            → Navigation hub, primary CTA buttons
NewEventScreen        → Event creation, judge configuration
ExistingEventsScreen  → Event history, filter completed/active
CategoryScreen        → CRUD operations for categories
PoomsaeConfigScreen   → Competitor import, poomsae assignment
CompetitionScreen     → **CORE SCORING NUCLEUS** (85% logic)
ResultsViewer         → Final rankings, medal assignments

// SCORING SUBSYSTEMS (within CompetitionScreen)
PyramidLiveScoring    → Input panel for pyramid matches (Blue/Red split)
FreestyleScoring      → Grid-based judge scoring
RoundsCompetitorList  → Sequential competitor progression (rondas)
ScoreInput            → Reusable modal for tech + pres input
PyramidBracket        → Visualization + match selection

// UTILITY COMPONENTS
Header                → Navigation bar (logo + screen breadcrumb)
PoomsaeConfigScreen   → Competitor CSV import + poomsae drag-n-drop
ActivationScreen      → License input modal
PdfExportConfigScreen → Export options UI

// PDI COMPONENTS (14 distinct views)
IdleScreen            → Default: Kalyo logo + animated gradients (Blue/Red)
PYRAMID_LIVE          → Split Blue/Red, tech + pres live scores
PYRAMID_WINNER        → Winner announcement (7s static)
PYRAMID_FINAL_RESULTS → Podium (Au/Ag/Br with medal colors)
PYRAMID_BRACKET       → Complete tournament tree, interactive
ROUNDS_LIVE           → Tech + Pres table, all competitors
ROUNDS_RESULTS        → Ranked table (1st, 2nd, 3rd, ...)
ROUNDS_QUALIFICATION  → Qualification round results
ROUNDS_FINALISTS      → Finalists who advanced
FREESTYLE_PRESENTATION → Competitor name + delegation display
TECHNICAL_TIE         → Tie-break referee screen (yellow border)
POOMSAE_DRAW          → Sorteo poomsaes assigned
COMPETITION_START     → Event kickoff: category + system + poomsaes
```

---

## 4. COMPETITION SYSTEMS (ALGORITHMIC DETAIL)

### 4.1 RONDAS (Qualification + Finals)

#### 4.1.1 System Flow

```
┌─────────────────────────────────────────┐
│  Qualification Round (All competitors)   │
│                                         │
│  For each Competitor:                   │
│  ├─ Judge 1,2,3 (or 5,7): Technical   │
│  ├─ Judge 1,2,3 (or 5,7): Presentation │
│  ├─ Calculate Avg_Tech, Avg_Pres       │
│  └─ Final Score = Avg_Tech + Avg_Pres  │
│                                         │
│  Sort by Final Score (descending)       │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  Determine Finalists (Top N)             │
│  qualifiedCompetitorIds = [...top N...] │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  Final Round                            │
│  Only qualified competitors participate │
│  Scores reset, new tech+pres entered    │
│                                         │
│  Calculate same as qualification        │
│  Final winner = highest score           │
└─────────────────────────────────────────┘
```

#### 4.1.2 Scoring Algorithm (WT-Compliant)

```typescript
interface Score {
  technical: (number | null)[];      // Index per judge
  presentation: (number | null)[];   // Index per judge
}

function calculateAverage(
  scores: (number | null)[],
  numJudges: 3 | 5 | 7
): number {
  // Step 1: Filter valid scores (≥0, ≠null)
  const validScores = scores.filter(s => s !== null && s >= 0);
  
  // Step 2: Determine averaging logic
  if (numJudges < 5 || validScores.length < 3) {
    // Use all valid scores
    const sum = validScores.reduce((a, b) => a + b, 0);
    return validScores.length > 0 ? sum / validScores.length : 0;
  } else {
    // W.T. RULE: Discard min + max, average rest
    const sorted = [...validScores].sort((a, b) => a - b);
    const middle = sorted.slice(1, -1);  // Remove [0] and [length-1]
    const sum = middle.reduce((a, b) => a + b, 0);
    return middle.length > 0 ? sum / middle.length : 0;
  }
}

function calculatePoomsaeFinalScore(score: Score, numJudges): number {
  const techAvg = calculateAverage(score.technical, numJudges);
  const presAvg = calculateAverage(score.presentation, numJudges);
  return techAvg + presAvg;  // Range: 0 to ~80 (judge scale dependent)
}

function calculateCompetitorFinalScore(
  competitorScore: CompetitorScore,
  numJudges: 3 | 5 | 7,
  poomsaeCount: 1 | 2
): number {
  const p1Score = calculatePoomsaeFinalScore(
    competitorScore.poomsae1,
    numJudges
  );
  
  if (poomsaeCount === 1) return p1Score;
  
  const p2Score = calculatePoomsaeFinalScore(
    competitorScore.poomsae2,
    numJudges
  );
  
  if (p1Score > 0 && p2Score > 0) {
    return (p1Score + p2Score) / 2;  // Average both
  }
  
  return p1Score > 0 ? p1Score : p2Score;  // Return non-zero
}

// Usage in CompetitionScreen:
const finalScore = calculateCompetitorFinalScore(
  competitorScores[competitorId],
  judgeCount,    // 3 | 5 | 7
  poomsaeCount   // 1 | 2
);
```

#### 4.1.3 Storage Model (SQLite)

```sql
-- Rondas qualification scores stored as JSON in category.scores
[
  {
    "competitorId": "uuid-123",
    "poomsae1": {
      "technical": [7.5, 8.0, 7.8],
      "presentation": [8.2, 8.5, 8.1]
    },
    "finalScore": 31.6
  },
  ...
]

-- Qualified competitors for finals:
qualifiedCompetitorIds: ["uuid-456", "uuid-789", ...]
```

### 4.2 PIRÁMIDE (Tournament Bracket)

#### 4.2.1 Bracket Generation Algorithm

```typescript
// src/pyramidGenerator.ts

interface PyramidMatch {
  id: string;
  phase: 'Octavos' | 'Cuartos' | 'Semifinal' | 'Final';
  matchNumber: number;
  competitorBlue: Competitor | null;
  competitorRed: Competitor | null;
  winner: 'blue' | 'red' | null;
  scoreBlueP1?: Score;
  scoreRedP1?: Score;
  scoreBlueP2?: Score;  // Optional if 2 poomsaes
  scoreRedP2?: Score;
  nextMatchId?: string;
  winnerTargetSlot?: 'blue' | 'red';
}

function generatePyramidBrackets(
  competitors: Competitor[],
  poomsaeCount: 1 | 2,
  useLottery: boolean
): PyramidMatch[] {
  // Step 1: Calculate next power of 2 (e.g., 5 → 8)
  const numCompetitors = competitors.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numCompetitors)));
  const byesNeeded = nextPowerOf2 - numCompetitors;
  
  // Step 2: Seeding order (standard tournament seeding)
  const seedingOrder = generateSeedingOrder(nextPowerOf2);
  // Example: [1, 8, 4, 5, 2, 7, 3, 6]
  
  // Step 3: Assign competitors to slots
  const slots: (Competitor | null)[] = new Array(nextPowerOf2).fill(null);
  
  if (useLottery) {
    // Shuffle competitors randomly
    const shuffled = competitors.sort(() => Math.random() - 0.5);
    seedingOrder.forEach((seed, idx) => {
      slots[seed - 1] = shuffled[idx] || null;
    });
  } else {
    // Use provided order
    competitors.forEach((comp, idx) => {
      slots[seedingOrder[idx] - 1] = comp;
    });
  }
  
  // Step 4: Generate matches for all phases
  const matches: PyramidMatch[] = [];
  const matchTree = generateMatchTree(slots, nextPowerOf2);
  
  return matchTree;
}

function generateSeedingOrder(size: number): number[] {
  if (size === 2) return [1, 2];
  if (size === 4) return [1, 4, 2, 3];
  if (size === 8) return [1, 8, 4, 5, 2, 7, 3, 6];
  if (size === 16) return [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];
  // ...larger brackets...
  return Array.from({length: size}, (_, i) => i + 1);
}
```

#### 4.2.2 Match Progression

```
First Round (Octavos):
  Match 1: Competitor #1 (Blue) vs #8 (Red)
  Match 2: Competitor #4 (Blue) vs #5 (Red)
  Match 3: Competitor #2 (Blue) vs #7 (Red)
  Match 4: Competitor #3 (Blue) vs #6 (Red)

Second Round (Cuartos):
  Winner(Match1) (Blue) vs Winner(Match2) (Red)
  Winner(Match3) (Blue) vs Winner(Match4) (Red)

Third Round (Semifinal):
  Winner(CuartoA) (Blue) vs Winner(CuartoB) (Red)

Fourth Round (Final):
  Winner(SemifinalA) (Blue) vs Winner(SemifinalB) (Red)
```

#### 4.2.3 Match Scoring & Winner Determination

```typescript
function determineMatchWinner(
  scoreBlue: { p1Score: number; p2Score?: number },
  scoreRed: { p1Score: number; p2Score?: number },
  poomsaeCount: 1 | 2
): 'blue' | 'red' | 'tie' {
  // Calculate final score for each competitor
  const finalBlue = poomsaeCount === 2
    ? (scoreBlue.p1Score + (scoreBlue.p2Score || 0)) / 2
    : scoreBlue.p1Score;
  
  const finalRed = poomsaeCount === 2
    ? (scoreRed.p1Score + (scoreRed.p2Score || 0)) / 2
    : scoreRed.p1Score;
  
  if (finalBlue > finalRed) return 'blue';
  if (finalRed > finalBlue) return 'red';
  return 'tie';  // Triggers TECHNICAL_TIE screen
}

// Pyramid scoring: 1 or 2 poomsaes per match
// Each poomsae: Tech + Pres (same calculation as Rondas)
// Final score = average of both (if 2) or single score (if 1)
```

#### 4.2.4 Data Model

```typescript
interface PyramidMatch {
  id: string;
  phase: string;
  matchNumber: number;
  competitorBlue: Competitor | null;
  competitorRed: Competitor | null;
  winner: 'blue' | 'red' | 'tie' | null;
  
  // Poomsae 1 scores
  scoreBlueP1?: {
    technical: number[];
    presentation: number[];
  };
  scoreRedP1?: {
    technical: number[];
    presentation: number[];
  };
  
  // Poomsae 2 scores (optional)
  scoreBlueP2?: { ... };
  scoreRedP2?: { ... };
  
  // Tree navigation
  nextMatchId?: string;
  winnerTargetSlot?: 'blue' | 'red';
}

// Stored in category.pyramidMatches as JSON array
pyramidMatches: PyramidMatch[] // All matches for tournament
```

### 4.3 FREESTYLE (Presentation)

#### 4.3.1 System Flow

```
┌──────────────────────────────────────────┐
│  Freestyle Competition                   │
│                                          │
│  For each Competitor:                    │
│  ├─ Display name + delegation (PDI)      │
│  ├─ Competitor performs poomsae          │
│  ├─ Judges enter Tech + Pres scores      │
│  ├─ Calculate final score (same as rondas)
│  └─ Next competitor                      │
│                                          │
│  Final Ranking: Sort by final score desc │
└──────────────────────────────────────────┘
```

#### 4.3.2 Scoring

```typescript
// Identical to Rondas scoring
const freestyleScore = calculateCompetitorFinalScore(
  competitorScore,
  numJudges,
  1  // 1 poomsae per freestyle competitor
);
```

---

## 5. COLOR SCHEME & VISUAL DESIGN

### 5.1 Global Color Palette

#### 5.1.1 Light Mode (Default)

```css
/* Background Colors */
--bg-primary: #ffffff (white)
--bg-secondary: #f8fafc (gray-50)
--bg-input: #ffffff (white)

/* Text Colors */
--text-primary: #0f172a (slate-900)
--text-secondary: #64748b (slate-600)
--text-tertiary: #cbd5e1 (slate-300)

/* Border Colors */
--border-primary: #e2e8f0 (slate-200)
--border-secondary: #cbd5e1 (slate-300)

/* Status Colors */
--success: #10b981 (green-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
--info: #0ea5e9 (cyan-500)
```

#### 5.1.2 Dark Mode (#0e1424)

```css
/* Background Colors */
--bg-primary: #0e1424 (custom navy)
--bg-secondary: #1a2332 (derived)
--bg-tertiary: #2d3e52 (derived)

/* Text Colors */
--text-primary: #ffffff (white)
--text-secondary: #94a3b8 (slate-400)
--text-tertiary: #64748b (slate-600)

/* Accent Colors */
--accent-blue: #60a5fa (blue-400)
--accent-red: #f87171 (red-400)
--accent-yellow: #fbbf24 (amber-400)
--accent-green: #4ade80 (green-400)
```

### 5.2 Component-Level Colors

#### 5.2.1 Main App (Light)

```typescript
// HomeScreen
<h1 className="
  text-transparent
  bg-clip-text
  bg-gradient-to-r
  from-blue-600    // #2563eb
  via-indigo-600   // #4f46e5
  to-red-600       // #dc2626
  drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]
">PANEL DE CONTROL</h1>

// Action Cards
Blue Card:   border-l-4 border-blue-500 bg-white dark:from-blue-600/20
Red Card:    border-l-4 border-red-500 bg-white dark:from-red-600/20

// Button States
Hover:       transform scale-[1.02], shadow-2xl
Active:      bg-blue-600 text-white
Disabled:    opacity-50, cursor-not-allowed
```

#### 5.2.2 Main App (Dark #0e1424)

```typescript
// Root container
<div className="
  min-h-screen
  bg-white
  dark:bg-[#0e1424]
  text-slate-900
  dark:text-white
  transition-colors duration-300
  selection:bg-blue-500/30
">

// Competition Screen
{/* Blue Competitor (Rondas) */}
<p className="
  text-5xl
  font-black
  text-blue-500
  drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]
">
  {techAvg.toFixed(2)}
</p>

{/* Red Competitor (Rondas) */}
<p className="
  text-5xl
  font-black
  text-red-500
  drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]
">
  {presAvg.toFixed(2)}
</p>

// Bracket visualization
Winner:      bg-blue-600/90 shadow-[0_0_15px_rgba(37,99,235,0.5)]
Loser:       bg-slate-900/50 border-blue-900/30
```

### 5.3 PDI (Public Display) Color Scheme

#### 5.3.1 Gradient Backgrounds

```typescript
// IdleScreen (Default)
<div className="
  bg-gradient-to-br
  from-gray-800
  via-gray-900
  to-black
  text-white
">
  {/* Animated blobs */}
  <div className="
    w-96 h-96
    bg-blue-500
    rounded-full
    blur-3xl
    animate-pulse
  "/> {/* Blue blob, position top-left */}
  
  <div className="
    w-96 h-96
    bg-red-500
    rounded-full
    blur-3xl
    animate-pulse
    [animation-delay: '1s']
  "/> {/* Red blob, position bottom-right, delayed */}
</div>

// PyramidLiveScreen
Left (Red/Hong):    bg-gradient-to-br from-red-500 to-red-700
Right (Blue/Chong):  bg-gradient-to-br from-blue-500 to-blue-700
```

#### 5.3.2 Competition-Specific Colors

```typescript
// PYRAMID_LIVE (Split screen)
// LEFT SIDE (Competitor Red/Hong)
<div className="w-1/2 bg-gradient-to-br from-red-500 to-red-700">
  <h2 className="text-5xl font-extrabold uppercase text-white">HONG</h2>
  
  {/* Score cards */}
  <div className="bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
    <p className="text-white">TÉCNICA</p>
    <p className="text-5xl font-bold text-white">7.84</p>
  </div>
</div>

// RIGHT SIDE (Competitor Blue/Chong)
<div className="w-1/2 bg-gradient-to-br from-blue-500 to-blue-700">
  <h2 className="text-5xl font-extrabold uppercase text-white">CHONG</h2>
  {/* Same structure, blue colors */}
</div>

// ROUNDS_LIVE
<div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
  {/* Technical scores table (left) */}
  {/* Presentation scores table (right) */}
</div>

// PYRAMID_FINAL_RESULTS (Podium)
// Oro/Gold medal
<div className="
  w-full
  bg-gradient-to-t
  from-yellow-700
  to-yellow-500
  rounded-t-lg
  shadow-[0_0_50px_rgba(234,179,8,0.4)]
  h-48 md:h-64
">
  <p className="text-6xl font-black text-white/20">1</p>
</div>

// Plata/Silver medal
<div className="
  bg-gradient-to-t
  from-gray-700
  to-gray-500
  h-32 md:h-48
">
  <p className="text-4xl font-black text-white/10">2</p>
</div>

// Bronce/Bronze medal
<div className="
  bg-gradient-to-t
  from-orange-800
  to-orange-600
  h-24 md:h-40
">
  <p className="text-4xl font-black text-white/10">3</p>
</div>

// TECHNICAL_TIE
<div className="
  bg-gray-900
  text-white
  flex flex-col
  justify-center items-center
">
  <div className="
    bg-gray-800
    border-4
    border-yellow-500
    rounded-2xl
    p-12
    shadow-2xl
  ">
    <p className="text-4xl text-center text-white">
      Por el <span className="font-bold text-yellow-400">{position}°</span> puesto
    </p>
  </div>
</div>
```

### 5.4 Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',  // Enable dark:* class prefix
  theme: {
    extend: {},  // Using Tailwind defaults (no custom palette)
  },
  plugins: [],
}
```

### 5.5 CSS Animations

```css
/* index.css */

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 1s ease-in-out;
}

/* Bracket scrollbar custom styling */
.bracket-scroll::-webkit-scrollbar {
  height: 12px;
}
.bracket-scroll::-webkit-scrollbar-track {
  background: transparent;
  @apply bg-slate-100 dark:bg-slate-800;
  border-radius: 6px;
}
.bracket-scroll::-webkit-scrollbar-thumb {
  border-radius: 6px;
  @apply bg-slate-300 dark:bg-slate-600;
}
.bracket-scroll::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-400 dark:bg-slate-500;
}

/* Font system (local, offline) */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 300/400/500/600/700/900;
  src: url('./assets/fonts/Inter-*.ttf') format('truetype');
}
```

---

## 6. PDI (PUBLIC DISPLAY INTERFACE) SPECIFICATION

### 6.1 Architecture & Communication

```typescript
// Main app ← → localStorage bridge ← → PDI app

// CompetitionScreen.tsx (Main)
const updatePdi = (payload: PdiPayload) => {
  localStorage.setItem('kalyo-pdi-payload', JSON.stringify(payload));
  // StorageEvent fired across windows
};

interface PdiPayload {
  view: PdiView;
  data: PdiViewData;
}

// PublicDisplayApp.tsx (PDI)
useEffect(() => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'kalyo-pdi-payload') {
      const newPayload = JSON.parse(event.newValue);
      setPayload(newPayload);
      // Component re-renders with new data
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

### 6.2 PDI Views (14 Total)

| View ID | Purpose | Data Structure | Destination | Comments |
|---------|---------|-----------------|-------------|----------|
| `IDLE` | Default screen | Empty | PDI | Animated logo + blue/red blobs |
| `PYRAMID_LIVE` | Match in progress | `PdiPyramidLiveData` | PDI | Split Blue/Red, tech+pres live |
| `PYRAMID_WINNER` | Winner announcement | `{name, delegation}` | PDI | 7s static, auto-dismiss |
| `PYRAMID_FINAL_RESULTS` | Podium display | `{first, second, third}` | PDI | 🥇🥈🥉 medals, standings |
| `PYRAMID_BRACKET` | Full tournament tree | `PyramidMatch[]` | PDI | Interactive bracket display |
| `ROUNDS_LIVE` | Tech+Pres table | `PdiRoundsLiveData` | PDI | Live competitor scores |
| `ROUNDS_RESULTS` | Ranked table | `DisplayScore[]` | PDI | Final standings |
| `ROUNDS_QUALIFICATION` | Qualification results | `DisplayScore[]` | PDI | Top N ranked (pre-finals) |
| `ROUNDS_FINALISTS` | Finalists list | `Competitor[]` | PDI | Who advanced to finals |
| `FREESTYLE_PRESENTATION` | Competitor intro | `{name, delegation}` | PDI | Simple text display |
| `TECHNICAL_TIE` | Tie-break scenario | `{position, competitors[]}` | PDI | Yellow border emergency view |
| `POOMSAE_DRAW` | Sorteo display | `{poomsaes[]}` | PDI | Assigned poomsaes |
| `COMPETITION_START` | Event kickoff | `{categoryTitle, system, poomsaes}` | PDI | Intro slide |
| *(others)* | - | - | - | - |

### 6.3 Data Flow Examples

#### 6.3.1 PYRAMID_LIVE Example

```typescript
// Main: CompetitionScreen.tsx
const handlePyramidScoresEntered = (blueScores, redScores, match) => {
  // Calculate finals
  const blueFinal = calculateCompetitorFinalScore(blueScores, numJudges, poomsaeCount);
  const redFinal = calculateCompetitorFinalScore(redScores, numJudges, poomsaeCount);
  
  updatePdi({
    view: 'PYRAMID_LIVE',
    data: {
      categoryTitle: category.title,
      phase: match.phase,
      matchNumber: match.matchNumber,
      competitorBlue: {
        name: match.competitorBlue.name,
        delegation: match.competitorBlue.delegation,
        score: blueFinal,
        techAvg: calculateAverage(blueScores.technical, numJudges),
        presAvg: calculateAverage(blueScores.presentation, numJudges),
        p1Score: calculatePoomsaeFinalScore(blueScores.poomsae1, numJudges),
        p2Score: calculatePoomsaeFinalScore(blueScores.poomsae2, numJudges) || 0,
        rawScores: blueScores,
        poomsaeNameToPerform: currentPoomsae.name
      },
      competitorRed: { /* similar */ }
    }
  });
};

// PDI: PyramidLiveScreen.tsx
export const PyramidLiveScreen: React.FC<PyramidLiveScreenProps> = ({
  categoryTitle, phase, matchNumber, competitorBlue, competitorRed
}) => {
  return (
    <div className="h-screen w-screen flex flex-col text-white font-sans">
      <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800">
        <h1 className="text-4xl font-bold">{categoryTitle}</h1>
        <p className="text-2xl">Fase: {phase} - Encuentro #{matchNumber}</p>
      </header>
      
      <div className="flex flex-grow">
        {/* LEFT: RED/HONG */}
        <div className="w-1/2 bg-gradient-to-br from-red-500 to-red-700 p-6">
          <h2 className="text-5xl font-extrabold uppercase">HONG</h2>
          <div className="grid grid-cols-2 gap-6 my-8">
            <div className="bg-white bg-opacity-10 rounded-xl p-4">
              <p className="text-xl">TÉCNICA</p>
              <p className="text-5xl font-bold">{competitorRed.techAvg.toFixed(2)}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-xl p-4">
              <p className="text-xl">PRESENTACIÓN</p>
              <p className="text-5xl font-bold">{competitorRed.presAvg.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-center mt-12 bg-white bg-opacity-20 p-6 rounded-lg">
            <p className="text-7xl font-black">{competitorRed.score.toFixed(2)}</p>
          </div>
        </div>
        
        {/* RIGHT: BLUE/CHONG */}
        <div className="w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 p-6">
          {/* Mirror of LEFT */}
        </div>
      </div>
    </div>
  );
};
```

#### 6.3.2 TECHNICAL_TIE Example

```typescript
// Main: CompetitionScreen.tsx
const handleTieDetected = (tied: Competitor[]) => {
  updatePdi({
    view: 'TECHNICAL_TIE',
    data: {
      position: 1,  // 1st place tie
      competitors: tied
    }
  });
};

// PDI: TechnicalTieScreen.tsx
<div className="pdi-screen bg-gray-900 text-white flex items-center justify-center">
  <div className="bg-gray-800 border-4 border-yellow-500 rounded-2xl p-12">
    <p className="text-4xl text-center">
      Por el <span className="font-bold text-yellow-400">1°</span> puesto, los siguientes
      competidores deben realizar un Poomsae de desempate:
    </p>
    <div className="my-10 border-t-2 border-b-2 border-gray-600 py-6">
      {competitors.map((comp, i) => (
        <p key={i} className="text-6xl font-semibold text-white my-4">
          {comp.name}
        </p>
      ))}
    </div>
  </div>
</div>
```

---

## 7. DATABASE SCHEMA

### 7.1 SQLite Tables

```sql
-- TABLE: events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,                    -- ISO 8601
  areaNumber INTEGER NOT NULL,
  areaChief TEXT NOT NULL,
  registrarName TEXT NOT NULL,
  judges TEXT,                           -- JSON: Judge[]
  status TEXT NOT NULL,                  -- 'active' | 'completed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,                   -- Auto-generated
  discipline TEXT NOT NULL,              -- 'Taekwondo' | 'Para-Taekwondo'
  modality TEXT NOT NULL,                -- 'Traditional' | 'Creative'
  division TEXT NOT NULL,                -- 'Individual' | 'Team'
  gender TEXT NOT NULL,                  -- 'Femenino' | 'Masculino'
  ageGroup TEXT NOT NULL,                -- 'Cadete (12-14)' | 'Junior (15-17)'
  beltLevel TEXT NOT NULL,               -- 'Negro' | 'Otros'
  disabilityGroup TEXT,                  -- Para-Taekwondo specific
  system TEXT NOT NULL,                  -- 'Rondas' | 'Pirámide' | 'Freestyle'
  status TEXT NOT NULL,                  -- 'pending' | 'active' | 'completed'
  round TEXT,                            -- 'qualification' | 'final'
  poomsaeConfig TEXT,                    -- JSON: PoomsaeConfig
  competitors TEXT NOT NULL,             -- JSON: Competitor[]
  pyramidMatches TEXT,                   -- JSON: PyramidMatch[] (null if Rondas)
  scores TEXT,                           -- JSON: CompetitorScore[]
  qualifiedCompetitorIds TEXT,           -- JSON: string[] (for Rondas finals)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);
```

### 7.2 Data Types (TypeScript)

```typescript
// src/types.ts

interface Event {
  id: string;
  name: string;
  date: string;              // ISO 8601
  areaNumber: number;
  areaChief: string;
  registrarName: string;
  judges: Judge[];
  categories?: Category[];
  status: 'active' | 'completed';
}

interface Judge {
  id: string;
  name: string;
  position: number;          // 1, 2, 3 (for 3 judges) or 1-7
}

interface Category {
  id: string;
  title: string;
  discipline: string;
  modality: string;
  division: string;
  gender: string;
  ageGroup: string;
  beltLevel: string;
  disabilityGroup?: string;
  system: 'Rondas' | 'Pirámide' | 'Freestyle';
  status: 'pending' | 'active' | 'completed' | 'tiebreak';
  round?: 'qualification' | 'final';
  poomsaeConfig: PoomsaeConfig;
  competitors: Competitor[];
  scores: CompetitorScore[];
  pyramidMatches?: PyramidMatch[];
  qualifiedCompetitorIds?: string[];
}

interface Competitor {
  id: string;
  name: string;
  delegation: string;
  seedNumber?: number;       // Pyramid seeding
}

interface Score {
  technical: (number | null)[];
  presentation: (number | null)[];
}

interface CompetitorScore {
  competitorId: string;
  poomsae1?: Score;
  poomsae2?: Score;
  finalScore?: number;
  roundType?: 'qualification' | 'final';
}

interface PyramidMatch {
  id: string;
  phase: 'Octavos' | 'Cuartos' | 'Semifinal' | 'Final';
  matchNumber: number;
  competitorBlue: Competitor | null;
  competitorRed: Competitor | null;
  winner: 'blue' | 'red' | 'tie' | null;
  scoreBlueP1?: Score;
  scoreRedP1?: Score;
  scoreBlueP2?: Score;
  scoreRedP2?: Score;
  nextMatchId?: string;
  winnerTargetSlot?: 'blue' | 'red';
}

interface PoomsaeConfig {
  poomsaeCount: 1 | 2;
  useLottery: boolean;
  poomsaes: string[];        // e.g., ['Koryo', 'Keumgang']
}

interface DisplayScore {
  id: string;
  name: string;
  delegation: string;
  finalScore: number;
  techAvg: number;
  presAvg: number;
  rank?: number;
}
```

### 7.3 CRUD Operations (src/database.ts)

```typescript
// Tauri SQLite plugin integration

export async function getDb(): Promise<Database> {
  const db = await getDatabase();  // Tauri plugin
  return db;
}

export async function saveEvent(event: Event): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR REPLACE INTO events 
     (id, name, date, areaNumber, areaChief, registrarName, judges, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.name, event.date, event.areaNumber, 
     event.areaChief, event.registrarName, JSON.stringify(event.judges), event.status]
  );
}

export async function getEvents(): Promise<Event[]> {
  const db = await getDb();
  const events = await db.select('SELECT * FROM events');
  
  return events.map(row => ({
    ...row,
    judges: JSON.parse(row.judges || '[]')
  }));
}

export async function saveCategory(
  category: Category,
  eventId: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR REPLACE INTO categories 
     (id, event_id, title, system, status, competitors, scores, pyramidMatches, ...)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ...)`,
    [
      category.id,
      eventId,
      category.title,
      category.system,
      category.status,
      JSON.stringify(category.competitors),
      JSON.stringify(category.scores),
      JSON.stringify(category.pyramidMatches || []),
      // ...other fields...
    ]
  );
}

export async function getCategoryById(
  categoryId: string
): Promise<Category | null> {
  const db = await getDb();
  const result = await db.select(
    'SELECT * FROM categories WHERE id = ?',
    [categoryId]
  );
  
  if (!result.length) return null;
  
  const row = result[0];
  return {
    ...row,
    competitors: JSON.parse(row.competitors),
    scores: JSON.parse(row.scores),
    pyramidMatches: JSON.parse(row.pyramidMatches || '[]'),
    poomsaeConfig: JSON.parse(row.poomsaeConfig)
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM events WHERE id = ?', [eventId]);
  // Cascade: categories auto-deleted via FK constraint
}
```

---

## 8. STATE MANAGEMENT

### 8.1 localStorage Keys

```typescript
const STORAGE_KEYS = {
  EXPIRATION: 'kalyo-tkd-expiration',           // License expiry date
  CURRENT_EVENT: 'kalyo-tkd-current-event',     // Event UUID
  CURRENT_CATEGORY: 'kalyo-tkd-current-category', // Category UUID
  CURRENT_MATCH: 'kalyo-tkd-current-match',     // Match UUID (pyramid)
  PDI_PAYLOAD: 'kalyo-pdi-payload'              // PdiPayload JSON
};

// Usage in App.tsx
const savedEventId = localStorage.getItem(STORAGE_KEYS.CURRENT_EVENT);
if (savedEventId) {
  setCurrentEvent(savedEventId);
}

// Persistence
useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_EVENT, currentEvent?.id || '');
}, [currentEvent]);
```

### 8.2 React Hook Patterns

```typescript
// useLocalStorage.ts (Custom hook)
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  };

  return [storedValue, setValue] as const;
}

// Usage in CompetitionScreen
const [scores, setScores] = useLocalStorage<CompetitorScore[]>(
  'current-scores',
  []
);
```

### 8.3 App-Level State (App.tsx)

```typescript
const [screen, setScreen] = useState<Screen>('SPLASH');
const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
const [isActivated, setIsActivated] = useState(false);
const [events, setEvents] = useState<Event[]>([]);

// Effect: Load events from SQLite
useEffect(() => {
  const loadEvents = async () => {
    const loaded = await getEvents();
    setEvents(loaded);
  };
  loadEvents();
}, []);

// Effect: Check activation status
useEffect(() => {
  const expiry = localStorage.getItem('kalyo-tkd-expiration');
  if (expiry) {
    const today = new Date();
    const expiryDate = new Date(expiry);
    setIsActivated(today < expiryDate);
  } else {
    setIsActivated(false);
  }
}, []);
```

---

## 9. EXPORT FUNCTIONALITY

### 9.1 Excel Export (excelExporter.ts)

```typescript
import ExcelJS from 'exceljs';

export async function exportCategoryToExcel(
  event: Event,
  category: Category
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // WORKSHEET 1: Summary
  const wsumm = workbook.addWorksheet('Resumen');
  wsumm.columns = [
    { header: 'Evento', key: 'event', width: 30 },
    { header: 'Categoría', key: 'category', width: 30 },
    { header: 'Sistema', key: 'system', width: 15 },
    { header: 'Jueces', key: 'judges', width: 20 }
  ];
  wsumm.addRow({
    event: event.name,
    category: category.title,
    system: category.system,
    judges: event.judges.length
  });

  // WORKSHEET 2: Competitors
  const wscomp = workbook.addWorksheet('Competidores');
  wscomp.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre', key: 'name', width: 25 },
    { header: 'Delegación', key: 'delegation', width: 20 }
  ];
  category.competitors.forEach(comp => {
    wscomp.addRow(comp);
  });

  // WORKSHEET 3: Scores
  const wsscore = workbook.addWorksheet('Puntuaciones');
  wsscore.columns = [
    { header: 'Competidor', key: 'name', width: 25 },
    { header: 'Técnica', key: 'tech', width: 12 },
    { header: 'Presentación', key: 'pres', width: 12 },
    { header: 'Puntuación Final', key: 'final', width: 15 }
  ];
  
  const rankings = category.scores
    .map(s => {
      const comp = category.competitors.find(c => c.id === s.competitorId);
      return {
        name: comp?.name || 'Unknown',
        tech: calculateAverage(s.poomsae1?.technical || [], event.judges.length),
        pres: calculateAverage(s.poomsae1?.presentation || [], event.judges.length),
        final: s.finalScore || 0
      };
    })
    .sort((a, b) => (b.final || 0) - (a.final || 0));

  rankings.forEach((r, idx) => {
    const row = wsscore.addRow(r);
    if (idx === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFDD00' } };
    if (idx === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
    if (idx === 2) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCD7F32' } };
  });

  // Save
  const fileName = `${event.name}_${category.title}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  await tauriFileSave(buffer, fileName);
}
```

### 9.2 PDF Export (pdfExporter.ts)

```typescript
import jsPDF from 'jspdf';
import AutoTable from 'jspdf-autotable';

export async function generatePdfReport(
  event: Event,
  category: Category,
  options: PdfExportOptions
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page 1: Header + Event Info
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Kalyo TKD', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Reporte: ${event.name}`, pageWidth / 2, 40, { align: 'center' });
  doc.text(`Categoría: ${category.title}`, pageWidth / 2, 50, { align: 'center' });

  // Water mark
  doc.setOpacity(0.1);
  doc.addImage(logoSvg, 'SVG', 50, 100, 100, 100);
  doc.setOpacity(1);

  // Page 2: Results table
  doc.addPage();
  
  const tableData = category.scores
    .map(s => {
      const comp = category.competitors.find(c => c.id === s.competitorId);
      return [
        comp?.name || '---',
        comp?.delegation || '---',
        calculateAverage(s.poomsae1?.technical, judges.length).toFixed(2),
        calculateAverage(s.poomsae1?.presentation, judges.length).toFixed(2),
        (s.finalScore || 0).toFixed(2)
      ];
    })
    .sort((a, b) => parseFloat(b[4]) - parseFloat(a[4]));

  AutoTable(doc, {
    head: [['Nombre', 'Delegación', 'Técnica', 'Presentación', 'Total']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    bodyStyles: { textColor: 0 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    startY: 20,
    margin: { left: 15, right: 15 }
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Generado con Kalyo TKD Poomsaes Scoring', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save
  const fileName = `${event.name}_${category.title}_Reporte.pdf`;
  await doc.save(fileName);
}
```

---

## 10. SECURITY & ACTIVATION

### 10.1 License Activation Flow

```typescript
// ActivationScreen.tsx

const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleActivate = () => {
  const ACTIVATION_KEY = 'KalyoTkd@2025';
  
  if (password === ACTIVATION_KEY) {
    // Valid: Set expiration to current date + 365 days
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    localStorage.setItem(
      'kalyo-tkd-expiration',
      expirationDate.toISOString()
    );
    
    setIsActivated(true);
    setScreen('HOME');
  } else {
    setError('Contraseña incorrecta');
  }
};
```

### 10.2 Expiration Check

```typescript
// App.tsx

useEffect(() => {
  const checkActivation = () => {
    const expiryStr = localStorage.getItem('kalyo-tkd-expiration');
    
    if (!expiryStr) {
      setIsActivated(false);
      return;
    }
    
    const today = new Date();
    const expiry = new Date(expiryStr);
    
    if (today < expiry) {
      setIsActivated(true);
    } else {
      setIsActivated(false);
      localStorage.removeItem('kalyo-tkd-expiration');
    }
  };
  
  checkActivation();
  // Re-check every hour
  const interval = setInterval(checkActivation, 3600000);
  return () => clearInterval(interval);
}, []);
```

### 10.3 Function Guards

```typescript
// HomeScreen.tsx

const handleCreateEventClick = () => {
  if (!isActivated) {
    alert('La licencia del software ha expirado.');
    setScreen('ACTIVATION');
    return;
  }
  
  setScreen('NEW_EVENT');
};
```

---

## 11. BUILD & DEPLOYMENT

### 11.1 Build Commands

```bash
# Development
npm run dev                 # Vite dev server + Tauri webview

# Production build (local testing)
npm run build             # Vite build + Tauri resources

# Full executable generation
npm run tauri build       # Creates: .exe/.dmg/.AppImage

# Build for specific OS
cargo tauri build --target x86_64-pc-windows-msvc  # Windows
cargo tauri build --target x86_64-apple-darwin     # macOS
cargo tauri build --target x86_64-unknown-linux-gnu # Linux
```

### 11.2 Build Output Structure

```
dist/
├── index.html              # Main app entry
├── public.html             # PDI app entry
├── assets/
│   ├── fonts/              # Local Inter fonts
│   ├── KalyoTKD.svg       # Logo
│   └── [chunks]           # Code-split bundles
├── [main.*.js]            # Main app bundle
├── [public.*.js]          # PDI app bundle
└── [vendor.*.js]          # Shared dependencies

src-tauri/target/release/
├── app.exe (Windows)
├── app.dmg (macOS)
└── app.AppImage (Linux)
```

### 11.3 Tauri Configuration (tauri.conf.json)

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "windows": [
    {
      "label": "main",
      "title": "Kalyo TKD - Poomsaes Scoring",
      "url": "http://localhost:1420",
      "width": 1400,
      "height": 900,
      "resizable": true,
      "fullscreen": false
    },
    {
      "label": "public",
      "title": "Kalyo TKD - Public Display",
      "url": "http://localhost:1420/public.html",
      "width": 1920,
      "height": 1080,
      "resizable": true,
      "fullscreen": false,
      "visible": false
    }
  ]
}
```

---

## 12. TESTING STRATEGY

### 12.1 Unit Tests (Proposed)

```typescript
// __tests__/scoring.test.ts

describe('Scoring Algorithms', () => {
  
  test('calculateAverage with 3 judges', () => {
    const scores = [7.5, 8.0, 7.8];
    const avg = calculateAverage(scores, 3);
    expect(avg).toBeCloseTo(7.767, 2);
  });
  
  test('calculateAverage with 5 judges (discard min/max)', () => {
    const scores = [7.0, 8.5, 7.8, 9.0, 6.5];
    const avg = calculateAverage(scores, 5);
    // Discard 6.5 and 9.0 → avg(7.0, 8.5, 7.8) = 7.767
    expect(avg).toBeCloseTo(7.767, 2);
  });
  
  test('calculatePoomsaeFinalScore', () => {
    const score = {
      technical: [7.5, 8.0, 7.8],
      presentation: [8.2, 8.5, 8.1]
    };
    const final = calculatePoomsaeFinalScore(score, 3);
    expect(final).toBeCloseTo(15.9, 1);
  });
});

describe('Pyramid Bracket Generation', () => {
  
  test('generateSeedingOrder for 8 competitors', () => {
    const seeds = generateSeedingOrder(8);
    expect(seeds).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
  
  test('bracket has correct number of matches', () => {
    const competitors = [...Array(5)].map((_, i) => ({
      id: `${i}`,
      name: `Comp${i}`,
      delegation: 'Test'
    }));
    
    const matches = generatePyramidBrackets(competitors, 1, false);
    // 5 competitors → 8 slots → 7 matches (1+2+4 final)
    expect(matches.length).toBe(7);
  });
});
```

### 12.2 Integration Tests (Proposed)

```typescript
// __tests__/integration.test.ts

describe('Competition Workflow (Rondas)', () => {
  
  test('Full rondas competition flow', async () => {
    // 1. Create event
    const event = createEvent('Test Event', 3);
    await saveEvent(event);
    
    // 2. Create category
    const category = createCategory(event.id, 'Rondas');
    category.competitors = [
      { id: '1', name: 'Alice', delegation: 'A' },
      { id: '2', name: 'Bob', delegation: 'B' },
      { id: '3', name: 'Charlie', delegation: 'C' }
    ];
    await saveCategory(category, event.id);
    
    // 3. Enter scores for qualification
    category.scores = [
      {
        competitorId: '1',
        poomsae1: {
          technical: [7.5, 8.0, 7.8],
          presentation: [8.2, 8.5, 8.1]
        },
        finalScore: 31.6
      },
      // ... more competitors
    ];
    await saveCategory(category, event.id);
    
    // 4. Determine finalists
    const qualified = determineQualifiers(category.scores, 2);
    expect(qualified.length).toBe(2);
    
    // 5. Finals (new scores)
    // ... re-enter scores for finals phase
  });
});
```

---

## 13. PERFORMANCE OPTIMIZATION

### 13.1 Code Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'tailwindcss'],
          'pdi': [
            './components/pdi/PyramidLiveScreen',
            './components/pdi/RoundsLiveScreen'
          ]
        }
      }
    }
  }
});
```

### 13.2 Component Memoization

```typescript
// PyramidBracket.tsx
import React, { memo } from 'react';

const MatchCard = memo(({ match, onSelect }) => (
  <div onClick={() => onSelect(match)}>
    {/* Card content */}
  </div>
), (prev, next) => {
  // Custom comparison: only re-render if match data changed
  return JSON.stringify(prev.match) === JSON.stringify(next.match);
});
```

### 13.3 Lazy Loading

```typescript
// App.tsx
const CompetitionScreen = lazy(() => import('./components/CompetitionScreen'));
const ResultsViewer = lazy(() => import('./components/ResultsViewer'));

<Suspense fallback={<LoadingSpinner />}>
  {screen === 'COMPETITION' && <CompetitionScreen />}
</Suspense>
```

---

## 14. KNOWN LIMITATIONS & FUTURE ENHANCEMENTS

### 14.1 Current Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| Single device operation | No multi-machine sync | Use dual-monitor setup on same machine |
| localStorage sync only | Limited PDI flexibility | Upgrade to WebSocket in future |
| Hardcoded license key | Security risk | Implement server-side validation |
| Manual bracket creation | No admin UI for custom brackets | Implement bracket editor |
| CSV import only | Limited data sources | Add database import, API integration |

### 14.2 Proposed Enhancements

```
v2.2.0:
├─ WebSocket support for distributed systems
├─ Cloud backup (AWS S3 / Azure Blob)
├─ Custom bracket templates editor
├─ Live statistics dashboard
├─ Multi-language support (EN/ES/FR/etc)
└─ Role-based access control (RBACs)

v3.0.0:
├─ Web frontend (remove Tauri desktop dependency)
├─ Mobile scoring app
├─ Real-time video integration
├─ AR/VR competitor visualization
└─ AI-powered score suggestion
```

---

## APPENDIX A: ENVIRONMENT SETUP

```bash
# Prerequisites
node@18+
npm@9+
Rust@1.70+

# Installation
git clone <repo>
cd KalyoTKD_PS
npm install

# Development environment
npm run dev        # Start Vite + Tauri dev server
                  # Accessible: http://localhost:1420

# Build for production
npm run build      # Creates optimized dist/
npm run tauri build # Generates executables
```

---

## APPENDIX B: API REFERENCE (Key Functions)

```typescript
// src/scoring.ts
export function calculateAverage(scores, numJudges): number
export function calculatePoomsaeFinalScore(score, numJudges): number
export function calculateCompetitorFinalScore(score, numJudges, poomsaeCount): number

// src/pyramidGenerator.ts
export function generatePyramidBrackets(competitors, poomsaeCount, useLottery): PyramidMatch[]
export function generateSeedingOrder(size): number[]

// src/database.ts
export async function getDb(): Database
export async function saveEvent(event): void
export async function getEvents(): Event[]
export async function saveCategory(category, eventId): void
export async function getCategoryById(categoryId): Category | null
export async function deleteEvent(eventId): void

// excelExporter.ts
export async function exportCategoryToExcel(event, category): void

// pdfExporter.ts
export async function generatePdfReport(event, category, options): void

// tauriUtils.ts
export async function importCsvFile(): string | null
export async function readTextFile(path): string
export async function saveFile(data, filename): void
```

---

## APPENDIX C: GLOSSARY

| Term | Definition |
|------|-----------|
| **Rondas** | Qualification + Finals system where top competitors advance |
| **Pirámide** | Single/double-elimination bracket tournament (sequential phases) |
| **Freestyle** | Presentation-based competition with individual choreography |
| **Poomsae** | Traditional Korean martial arts form (choreographed pattern) |
| **Technical** | Score component evaluating form execution precision |
| **Presentation** | Score component evaluating artistic interpretation, energy, flow |
| **Hong/Chong** | Traditional Korean terms for Red/Blue sides (tournament convention) |
| **Seeding** | Bracket position assignment based on competitor ranking |
| **Bye** | Automatic advancement when opponent bracket slot empty |
| **PDI** | Public Display Interface (external screen showing live competition) |
| **WT** | World Taekwondo (international governing body, standards used) |

---

**Document End**

**Classification**: Technical Specification  
**Audience**: Software Developers, System Architects, QA Engineers  
**Status**: Current (Production v2.1.0)  
**Last Updated**: April 23, 2026
