const API_BASE = '/api';

export interface ApiEvent {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  privacyMode: 'STRICT' | 'BALANCED' | 'OFF';
  primaryColor: string | null;
  logoUrl: string | null;
  mainSessionStatus: 'IDLE' | 'RECORDING' | 'COMPLETED' | null;
  mainSessionStartTime: string | null;
  mainSessionDuration: number | null;
  streamUrl: string | null;
  tablesCount: number;
  sessionsCount: number;
  tracks: ApiTrack[];
  facilitators: ApiFacilitator[];
  sponsors: ApiSponsor[];
  agendaItems: ApiAgendaItem[];
}

export interface ApiTrack {
  id: number;
  eventId: number;
  name: string;
  color: string | null;
}

export interface ApiTable {
  id: number;
  eventId: number;
  joinCode: string;
  name: string;
  session: string | null;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  lastAudio: string | null;
  lastTranscript: string | null;
  topic: string | null;
  facilitatorId: number | null;
  trackId: number | null;
  isHot: boolean | null;
  facilitator?: ApiFacilitator;
  track?: ApiTrack;
  agendaItems?: ApiAgendaItem[];
}

export interface ApiFacilitator {
  id: number;
  eventId: number;
  userId: number | null;
  name: string;
  email: string;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE';
  assignedTableId: number | null;
}

export interface ApiSponsor {
  id: number;
  eventId: number;
  name: string;
  logoUrl: string | null;
  keywords: string[];
}

export interface ApiTranscript {
  id: number;
  tableId: number;
  timestamp: string;
  speaker: string | null;
  text: string;
  sentiment: number | null;
  isQuote: boolean | null;
}

export interface ApiInsight {
  id: number;
  eventId: number;
  type: 'THEME' | 'ACTION_ITEM' | 'QUESTION' | 'SENTIMENT_SPIKE' | 'GOLDEN_NUGGET';
  title: string;
  description: string | null;
  confidence: number | null;
  relatedTableIds: number[];
  evidenceCount: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  createdAt: string;
}

export interface ApiAgendaItem {
  id: number;
  eventId: number | null;
  tableId: number | null;
  phase: string;
  text: string;
  durationMinutes: number | null;
  sortOrder: number | null;
}

export interface ApiNotice {
  id: number;
  eventId: number;
  tableId: number | null;
  message: string;
  createdAt: string;
  isRead: boolean | null;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  events: {
    list: () => fetchApi<ApiEvent[]>('/events'),
    get: (id: number) => fetchApi<ApiEvent>(`/events/${id}`),
    create: (data: Partial<ApiEvent>) => fetchApi<ApiEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<ApiEvent>) => fetchApi<ApiEvent>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<{ success: boolean }>(`/events/${id}`, {
      method: 'DELETE',
    }),
  },
  
  tables: {
    list: (eventId: number) => fetchApi<ApiTable[]>(`/events/${eventId}/tables`),
    create: (eventId: number, data: Partial<ApiTable>) => fetchApi<ApiTable>(`/events/${eventId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<ApiTable>) => fetchApi<ApiTable>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<{ success: boolean }>(`/tables/${id}`, {
      method: 'DELETE',
    }),
    join: (joinCode: string) => fetchApi<ApiTable>(`/tables/${joinCode}/join`),
    getQRCode: (id: number) => fetchApi<{ qrCode: string; joinCode: string }>(`/tables/${id}/qrcode`),
  },
  
  transcripts: {
    listByEvent: (eventId: number) => fetchApi<ApiTranscript[]>(`/events/${eventId}/transcripts`),
    listByTable: (tableId: number) => fetchApi<ApiTranscript[]>(`/tables/${tableId}/transcripts`),
    create: (tableId: number, data: { speaker?: string; text: string; isQuote?: boolean }) => 
      fetchApi<ApiTranscript>(`/tables/${tableId}/transcripts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  insights: {
    list: (eventId: number) => fetchApi<ApiInsight[]>(`/events/${eventId}/insights`),
    create: (eventId: number, data: Partial<ApiInsight>) => fetchApi<ApiInsight>(`/events/${eventId}/insights`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<ApiInsight>) => fetchApi<ApiInsight>(`/insights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    generate: (eventId: number) => fetchApi<ApiInsight[]>(`/events/${eventId}/generate-insights`, {
      method: 'POST',
    }),
  },
  
  tracks: {
    list: (eventId: number) => fetchApi<ApiTrack[]>(`/events/${eventId}/tracks`),
    create: (eventId: number, data: Partial<ApiTrack>) => fetchApi<ApiTrack>(`/events/${eventId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<{ success: boolean }>(`/tracks/${id}`, {
      method: 'DELETE',
    }),
  },
  
  facilitators: {
    list: (eventId: number) => fetchApi<ApiFacilitator[]>(`/events/${eventId}/facilitators`),
    create: (eventId: number, data: Partial<ApiFacilitator>) => fetchApi<ApiFacilitator>(`/events/${eventId}/facilitators`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  
  sponsors: {
    list: (eventId: number) => fetchApi<ApiSponsor[]>(`/events/${eventId}/sponsors`),
    create: (eventId: number, data: Partial<ApiSponsor>) => fetchApi<ApiSponsor>(`/events/${eventId}/sponsors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<{ success: boolean }>(`/sponsors/${id}`, {
      method: 'DELETE',
    }),
    getStats: (eventId: number, sponsorId: number) => 
      fetchApi<{ keywords: { keyword: string; count: number; sentiment: number }[]; totalMentions: number; avgSentiment: number }>(
        `/events/${eventId}/sponsor-stats/${sponsorId}`
      ),
  },
  
  broadcast: (eventId: number, message: string, tableIds?: number[]) => 
    fetchApi<ApiNotice[]>(`/events/${eventId}/broadcast`, {
      method: 'POST',
      body: JSON.stringify({ message, tableIds }),
    }),
  
  notices: {
    list: (tableId: number) => fetchApi<ApiNotice[]>(`/tables/${tableId}/notices`),
  },
  
  ai: {
    query: (eventId: number, query: string) => 
      fetchApi<{ answer: string }>('/ai/query', {
        method: 'POST',
        body: JSON.stringify({ eventId, query }),
      }),
    getCoachTip: (tableId: number, agenda: any[]) =>
      fetchApi<{ tip: string }>('/ai/coach-tip', {
        method: 'POST',
        body: JSON.stringify({ tableId, agenda }),
      }),
    getSessionSummary: (tableId: number) =>
      fetchApi<{ 
        summary: string; 
        actionItems: string[]; 
        openQuestions: string[]; 
        themes: string[];
        transcriptCount: number;
      }>(`/tables/${tableId}/session-summary`),
  },
  
  sentiment: {
    getData: (eventId: number) => fetchApi<{ time: string; sentiment: number }[]>(`/events/${eventId}/sentiment-data`),
  },
  
  questions: {
    list: (eventId: number) => fetchApi<any[]>(`/events/${eventId}/questions`),
    create: (eventId: number, data: { question: string; askedBy?: string; isAnonymous?: boolean }) =>
      fetchApi<any>(`/events/${eventId}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        const handlers = this.listeners.get(type);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  subscribe(type: string, handler: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }
  
  disconnect() {
    this.ws?.close();
    this.listeners.clear();
  }
}

export const wsClient = new WebSocketClient();
