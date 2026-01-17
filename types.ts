
export enum TableStatus {
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE'
}

export enum InsightType {
  THEME = 'THEME',
  ACTION_ITEM = 'ACTION_ITEM',
  QUESTION = 'QUESTION',
  SENTIMENT_SPIKE = 'SENTIMENT_SPIKE',
  GOLDEN_NUGGET = 'GOLDEN_NUGGET'
}

export interface AgendaItem {
  id: string;
  phase: string;
  text: string;
  durationMinutes: number;
}

export interface TranscriptSegment {
  id: string;
  tableId: string;
  timestamp: number; // Unix timestamp
  speaker: string;
  text: string;
  sentiment: number; // -1 to 1
  isQuote?: boolean;
}

export interface MainSession {
  status: 'IDLE' | 'RECORDING' | 'COMPLETED';
  startTime?: number;
  duration: number; // in seconds
  streamUrl?: string; // HLS or RTMP URL
}

export interface Track {
  id: string;
  name: string;
  color: string; // Hex code
}

export interface Facilitator {
  id: string;
  name: string;
  email: string;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE';
  assignedTableId?: string;
}

export interface Branding {
  primaryColor: string;
  logoUrl?: string;
  eventNameOverride?: string;
}

export interface Sponsor {
    id: string;
    name: string;
    logoUrl?: string;
    keywords: string[]; // Keywords they want to track
}

export interface Event {
  id: string;
  name: string;
  startDate: string; // ISO Date String
  endDate: string;   // ISO Date String
  location: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  sessionsCount: number;
  tablesCount: number;
  privacyMode: 'STRICT' | 'BALANCED' | 'OFF';
  mainSession: MainSession;
  defaultAgenda: AgendaItem[];
  branding: Branding;
  tracks: Track[];
  facilitators: Facilitator[];
  sponsors: Sponsor[];
}

export interface Table {
  id: string;
  eventId: string;
  name: string;
  session: string;
  status: TableStatus;
  lastAudio: number;
  lastTranscript: number;
  topic: string;
  facilitatorId?: string; // Link to Facilitator
  facilitatorName: string; // Display name fallback
  trackId?: string; // Link to Track
  isHot?: boolean; // High activity or sentiment shift
  customAgenda?: AgendaItem[]; // If present, overrides event default
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0 to 1
  relatedTableIds: string[];
  evidenceCount: number;
  timestamp: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // For facilitator review
}

export interface ChartDataPoint {
  time: string;
  value: number;
  category?: string;
}
