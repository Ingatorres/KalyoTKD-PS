export interface Judge {
  id: string;
  name: string;
}

export enum CompetitionSystem {
  Rounds = 'Rondas',
  Pyramid = 'Pirámide',
  Freestyle = 'Freestyle',
}

export interface PoomsaeConfig {
    count: 1 | 2;
    useLottery: boolean;
    poomsaes: (string | null)[];
}

export interface Competitor {
  id: string;
  name: string;
  delegation: string;
  hasWarning?: boolean;
  warningMessage?: string;
}

export interface PyramidMatch {
    id: string;
    phase: string;
    matchNumber: number;
    competitorBlue: Competitor | null;
    competitorRed: Competitor | null;
    winner: 'blue' | 'red' | 'tie' | null;
    isReady: boolean; // True when both competitor slots are filled
    nextMatchId: string | null; // The ID of the match the winner proceeds to
    winnerTargetSlot: 'blue' | 'red' | null; // The slot the winner will fill in the next match
    vaiWinner?: 'blue' | 'red';
    scoreBlueP1?: Score | null;
    scoreRedP1?: Score | null;
    scoreBlueP2?: Score | null;
    scoreRedP2?: Score | null;
    poomsaes?: (string | null)[]; // Tracks which poomsaes were drawn for this match
}

export interface Score {
    technical: (number | null)[];
    presentation: (number | null)[];
}

export interface CompetitorScore {
    competitorId: string;
    poomsae1?: Score;
    poomsae2?: Score;
    finalScore?: number;
}

export interface DisplayScore {
  id: string;
  name: string;
  delegation: string;
  finalScore: number;
  techAvg: number;
  presAvg: number;
}

export interface PdiRoundsLiveData {
  categoryTitle: string;
  currentCompetitor: Competitor | null;
  poomsaeInfo: string;
  poomsaeCount: 1 | 2;
  liveScores: { technicalAvg: number; presentationAvg: number; finalScore: number; p1Score?: number; p1TechAvg?: number; p1PresAvg?: number; p2Score?: number; p2TechAvg?: number; p2PresAvg?: number; };
  allScores: DisplayScore[];
}

export interface Category {
  id: string;
  title: string;
  discipline: string;
  modality: string;
  division: string;
  gender: string;
  ageGroup: string;
  beltLevel: string;
  disabilityGroup?: string; // For Para-Taekwondo
  system: CompetitionSystem;
  poomsaeConfig: PoomsaeConfig;
  competitors: Competitor[];
  scores: CompetitorScore[];
  pyramidMatches: PyramidMatch[];
  status: 'pending' | 'active' | 'completed' | 'tiebreak';
  round?: 'qualification' | 'final' | 'tiebreak';
  qualifiedCompetitorIds?: string[];
  tieBreakCompetitorIds?: string[];
  semifinalLosers?: (Competitor & { semifinalScore: number })[];
}

export interface Event {
  id: string;
  name: string;
  date: string;
  areaNumber: number;
  areaChief: string;
  registrarName: string;
  judges: Judge[];
  categories: Category[];
  status: 'active' | 'completed'; // Event status
}

export type Screen = 
  | 'SPLASH'
  | 'ACTIVATION'
  | 'HOME'
  | 'NEW_EVENT'
  | 'EXISTING_EVENTS'
  | 'CATEGORY'
  | 'POOMSAE_CONFIG'
  | 'COMPETITION'
  | 'RESULTS_VIEWER';

// --- Opciones de Exportación ---
export interface PdfExportOptions {
  author: string;
  eventLogo: File | null;
  organizerLogo: File | null;
  includeJudges: boolean;
  includeSummary: boolean;
  includeMatchDetails: boolean;
  selectedCategoryIds?: string[];
}


// --- Public Display Interface (PDI) Types ---

export type PdiView = 
  | 'IDLE' 
  | 'ROUNDS_LIVE' 
  | 'ROUNDS_RESULTS' 
  | 'PYRAMID_LIVE' 
  | 'PYRAMID_FINAL_RESULTS'
  | 'PYRAMID_WINNER'
  | 'ROUNDS_FINAL_RESULTS'
  | 'PYRAMID_BRACKET'
  | 'POOMSAE_DRAW'
  | 'COMPETITION_START'
  | 'FREESTYLE_PRESENTATION'
  | 'TECHNICAL_TIE'
  | 'ROUNDS_QUALIFICATION_RESULTS'
  | 'ROUNDS_FINALISTS';

export interface PdiPoomsaeDrawData {
  categoryTitle: string;
  poomsaes: (string | null)[];
}

export interface PdiCompetitionStartData {
  categoryTitle: string;
  poomsaes: (string | null)[];
  system: CompetitionSystem;
}

export interface PdiFreestylePresentationData {
  categoryTitle: string;
  competitorName: string;
  competitorDelegation: string;
}

export interface PdiTechnicalTieData {
  categoryTitle: string;
  position: number;
  competitors: { name: string }[];
}

export interface PdiRoundsFinalistsData {
  categoryTitle: string;
  finalists: { name: string; delegation: string; finalScore: number }[];
  poomsaeInfo: string;
}

export interface PdiPyramidCompetitorData {
  name: string;
  delegation: string;
  score: number;
  techAvg: number;
  presAvg: number;
  rawScores: Score;
  p1Score: number;
  p2Score: number;
  poomsaeNameToPerform: string;
}

export interface PdiPyramidLiveData {
  categoryTitle: string;
  phase: string;
  matchNumber: number;
  competitorBlue: PdiPyramidCompetitorData;
  competitorRed: PdiPyramidCompetitorData;
  poomsaeInfo: string;
  modality?: string;
}

export interface PdiPyramidWinnerData {
  winner: 'blue' | 'red' | 'tie';
  competitorName: string;
  competitorDelegation: string;
  finalScore?: number;
  techAvg?: number;
  presAvg?: number;
  modality?: string;
}

export interface PdiPyramidFinalResultsData {
    categoryTitle: string;
    winners: {
        place: number;
        medal: 'Oro' | 'Plata' | 'Bronce';
        competitor: Competitor | null;
    }[];
    modality?: string;
}

export type PdiPayload =
  | { view: 'IDLE'; data: {} }
  | { view: 'ROUNDS_LIVE'; data: PdiRoundsLiveData }
  | { view: 'ROUNDS_RESULTS'; data: { categoryTitle: string; displayScores: DisplayScore[]; competitors: Competitor[] } } | { view: 'PYRAMID_LIVE'; data: PdiPyramidLiveData }
  | { view: 'PYRAMID_WINNER'; data: PdiPyramidWinnerData }
  | { view: 'PYRAMID_FINAL_RESULTS'; data: PdiPyramidFinalResultsData } // Corrected
  | { view: 'ROUNDS_FINAL_RESULTS'; data: { categoryTitle: string; displayScores: DisplayScore[] } }
  | { view: 'PYRAMID_BRACKET'; data: any }
  | { view: 'POOMSAE_DRAW'; data: PdiPoomsaeDrawData }
  | { view: 'COMPETITION_START'; data: PdiCompetitionStartData }
  | { view: 'FREESTYLE_PRESENTATION'; data: PdiFreestylePresentationData }
  | { view: 'TECHNICAL_TIE'; data: PdiTechnicalTieData }
  | { view: 'ROUNDS_QUALIFICATION_RESULTS'; data: { displayScores: DisplayScore[]; categoryTitle: string; competitors: Competitor[] } }
  | { view: 'ROUNDS_FINALISTS'; data: PdiRoundsFinalistsData };