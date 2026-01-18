import type { 
  ApiEvent, ApiTable, ApiTrack, ApiFacilitator, ApiSponsor, 
  ApiTranscript, ApiInsight, ApiAgendaItem 
} from './api';
import type { 
  Event, Table, Track, Facilitator, Sponsor, 
  TranscriptSegment, Insight, AgendaItem, MainSession, Branding 
} from '../types';
import { TableStatus, InsightType } from '../types';

export function convertApiEventToFrontend(apiEvent: ApiEvent): Event {
  const mainSession: MainSession = {
    status: apiEvent.mainSessionStatus || 'IDLE',
    startTime: apiEvent.mainSessionStartTime ? new Date(apiEvent.mainSessionStartTime).getTime() : undefined,
    duration: apiEvent.mainSessionDuration || 0,
    streamUrl: apiEvent.streamUrl || undefined,
  };
  
  const branding: Branding = {
    primaryColor: apiEvent.primaryColor || '#6366f1',
    logoUrl: apiEvent.logoUrl || undefined,
  };
  
  return {
    id: String(apiEvent.id),
    name: apiEvent.name,
    startDate: apiEvent.startDate,
    endDate: apiEvent.endDate,
    location: apiEvent.location || '',
    status: apiEvent.status,
    sessionsCount: apiEvent.sessionsCount || 0,
    tablesCount: apiEvent.tablesCount || 0,
    privacyMode: apiEvent.privacyMode,
    mainSession,
    defaultAgenda: (apiEvent.agendaItems || []).map(convertApiAgendaItemToFrontend),
    branding,
    tracks: (apiEvent.tracks || []).map(convertApiTrackToFrontend),
    facilitators: (apiEvent.facilitators || []).map(convertApiFacilitatorToFrontend),
    sponsors: (apiEvent.sponsors || []).map(convertApiSponsorToFrontend),
  };
}

export function convertApiTableToFrontend(apiTable: ApiTable): Table {
  return {
    id: apiTable.joinCode,
    eventId: String(apiTable.eventId),
    name: apiTable.name,
    session: apiTable.session || 'General Session',
    status: apiTable.status as TableStatus,
    lastAudio: apiTable.lastAudio ? new Date(apiTable.lastAudio).getTime() : Date.now(),
    lastTranscript: apiTable.lastTranscript ? new Date(apiTable.lastTranscript).getTime() : Date.now(),
    topic: apiTable.topic || 'General Discussion',
    facilitatorId: apiTable.facilitatorId ? String(apiTable.facilitatorId) : undefined,
    facilitatorName: apiTable.facilitator?.name || 'TBD',
    trackId: apiTable.trackId ? String(apiTable.trackId) : undefined,
    isHot: apiTable.isHot || false,
    customAgenda: apiTable.agendaItems?.map(convertApiAgendaItemToFrontend),
    _dbId: apiTable.id,
  };
}

export function convertApiTrackToFrontend(apiTrack: ApiTrack): Track {
  return {
    id: String(apiTrack.id),
    name: apiTrack.name,
    color: apiTrack.color || '#6366f1',
  };
}

export function convertApiFacilitatorToFrontend(apiFac: ApiFacilitator): Facilitator {
  return {
    id: String(apiFac.id),
    name: apiFac.name,
    email: apiFac.email,
    status: apiFac.status,
    assignedTableId: apiFac.assignedTableId ? String(apiFac.assignedTableId) : undefined,
  };
}

export function convertApiSponsorToFrontend(apiSponsor: ApiSponsor): Sponsor {
  return {
    id: String(apiSponsor.id),
    name: apiSponsor.name,
    logoUrl: apiSponsor.logoUrl || undefined,
    keywords: apiSponsor.keywords || [],
  };
}

export function convertApiTranscriptToFrontend(apiTranscript: ApiTranscript): TranscriptSegment {
  return {
    id: String(apiTranscript.id),
    tableId: String(apiTranscript.tableId),
    timestamp: new Date(apiTranscript.timestamp).getTime(),
    speaker: apiTranscript.speaker || 'Unknown',
    text: apiTranscript.text,
    sentiment: apiTranscript.sentiment || 0,
    isQuote: apiTranscript.isQuote || false,
  };
}

export function convertApiInsightToFrontend(apiInsight: ApiInsight): Insight {
  return {
    id: String(apiInsight.id),
    type: apiInsight.type as InsightType,
    title: apiInsight.title,
    description: apiInsight.description || '',
    confidence: apiInsight.confidence || 0.8,
    relatedTableIds: (apiInsight.relatedTableIds || []).map(String),
    evidenceCount: apiInsight.evidenceCount || 0,
    timestamp: new Date(apiInsight.createdAt).getTime(),
    status: apiInsight.status || undefined,
  };
}

export function convertApiAgendaItemToFrontend(apiItem: ApiAgendaItem): AgendaItem {
  return {
    id: String(apiItem.id),
    phase: apiItem.phase,
    text: apiItem.text,
    durationMinutes: apiItem.durationMinutes || 10,
  };
}

export function getDbIdFromTable(table: Table): number | undefined {
  return (table as any)._dbId;
}

export function createTableIdMapper(tables: Table[]): (dbId: number | string) => string {
  const dbIdToJoinCode = new Map<number, string>();
  tables.forEach(table => {
    const dbId = getDbIdFromTable(table);
    if (dbId !== undefined) {
      dbIdToJoinCode.set(dbId, table.id);
    }
  });
  
  return (dbId: number | string): string => {
    const numericId = typeof dbId === 'string' ? parseInt(dbId) : dbId;
    return dbIdToJoinCode.get(numericId) || String(dbId);
  };
}

export function convertApiTranscriptToFrontendWithMapper(
  apiTranscript: ApiTranscript, 
  tableIdMapper: (dbId: number | string) => string
): TranscriptSegment {
  return {
    id: String(apiTranscript.id),
    tableId: tableIdMapper(apiTranscript.tableId),
    timestamp: new Date(apiTranscript.timestamp).getTime(),
    speaker: apiTranscript.speaker || 'Unknown',
    text: apiTranscript.text,
    sentiment: apiTranscript.sentiment || 0,
    isQuote: apiTranscript.isQuote || false,
  };
}

export function convertApiInsightToFrontendWithMapper(
  apiInsight: ApiInsight,
  tableIdMapper: (dbId: number | string) => string
): Insight {
  return {
    id: String(apiInsight.id),
    type: apiInsight.type as InsightType,
    title: apiInsight.title,
    description: apiInsight.description || '',
    confidence: apiInsight.confidence || 0.8,
    relatedTableIds: (apiInsight.relatedTableIds || []).map(id => tableIdMapper(id)),
    evidenceCount: apiInsight.evidenceCount || 0,
    timestamp: new Date(apiInsight.createdAt).getTime(),
    status: apiInsight.status || undefined,
  };
}
