
import { Table, TableStatus, TranscriptSegment, Insight, InsightType, Event, AgendaItem, Track, Facilitator, Sponsor } from './types';

export const DEFAULT_AGENDA: AgendaItem[] = [
  { id: 'p1', phase: 'Intro', text: 'Kick off by asking everyone to introduce themselves and their role.', durationMinutes: 5 },
  { id: 'p2', phase: 'Discovery', text: 'What is the single biggest friction point in your first week?', durationMinutes: 15 },
  { id: 'p3', phase: 'Deep Dive', text: 'How do you currently handle knowledge sharing? What tools do you use?', durationMinutes: 20 },
  { id: 'p4', phase: 'Wrap Up', text: 'If you had a magic wand, what one thing would you fix immediately?', durationMinutes: 5 },
];

export const MOCK_TRACKS: Track[] = [
  { id: 't1', name: 'Product', color: '#6366f1' }, // Indigo
  { id: 't2', name: 'Sales', color: '#10b981' },   // Emerald
  { id: 't3', name: 'Marketing', color: '#f59e0b' }, // Amber
];

export const MOCK_FACILITATORS: Facilitator[] = [
  { id: 'f1', name: 'Sarah Jenkins', email: 'sarah.j@example.com', status: 'ACTIVE', assignedTableId: '7X92B1' },
  { id: 'f2', name: 'Mike Ross', email: 'mike.r@example.com', status: 'ACTIVE', assignedTableId: '3M88K2' },
  { id: 'f3', name: 'Jenny Lee', email: 'jenny.l@example.com', status: 'INVITED' },
];

export const MOCK_SPONSORS: Sponsor[] = [
    { id: 's1', name: 'Acme Cloud', keywords: ['Cloud', 'Migration', 'Infrastructure', 'AWS'] },
    { id: 's2', name: 'SecureNet', keywords: ['Security', 'Compliance', 'GDPR', 'Breach'] }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'evt1',
    name: 'Q3 Product Strategy Offsite',
    startDate: '2024-10-12T09:00:00',
    endDate: '2024-10-12T17:00:00',
    location: 'San Francisco, CA',
    status: 'LIVE',
    sessionsCount: 3,
    tablesCount: 5,
    privacyMode: 'STRICT',
    defaultAgenda: DEFAULT_AGENDA,
    branding: {
        primaryColor: '#4f46e5', // Indigo 600
        logoUrl: 'https://via.placeholder.com/150',
    },
    tracks: MOCK_TRACKS,
    facilitators: MOCK_FACILITATORS,
    sponsors: MOCK_SPONSORS,
    mainSession: {
      status: 'RECORDING',
      startTime: Date.now() - 3600000, // Started 1 hour ago
      duration: 3600,
      streamUrl: 'https://stream.mux.com/test.m3u8'
    }
  },
  {
    id: 'evt2',
    name: 'Customer Advisory Board',
    startDate: '2024-11-05T08:30:00',
    endDate: '2024-11-06T16:00:00',
    location: 'New York, NY',
    status: 'UPCOMING',
    sessionsCount: 2,
    tablesCount: 8,
    privacyMode: 'BALANCED',
    defaultAgenda: DEFAULT_AGENDA,
    branding: {
        primaryColor: '#000000',
    },
    tracks: [],
    facilitators: [],
    sponsors: [],
    mainSession: {
      status: 'IDLE',
      duration: 0
    }
  }
];

// Using 6-char alphanumeric codes for Table IDs
export const MOCK_TABLES: Table[] = [
  { id: '7X92B1', eventId: 'evt1', name: 'Table A1', session: 'Session 1: Onboarding', status: TableStatus.ACTIVE, lastAudio: Date.now(), lastTranscript: Date.now() - 2000, topic: 'First 30 Days', facilitatorName: 'Sarah J.', facilitatorId: 'f1', trackId: 't1' },
  { id: '3M88K2', eventId: 'evt1', name: 'Table A2', session: 'Session 1: Onboarding', status: TableStatus.ACTIVE, lastAudio: Date.now() - 500, lastTranscript: Date.now() - 5000, topic: 'First 30 Days', facilitatorName: 'Mike R.', facilitatorId: 'f2', trackId: 't1', isHot: true },
  { id: '9L22P4', eventId: 'evt1', name: 'Table B1', session: 'Session 1: Onboarding', status: TableStatus.DEGRADED, lastAudio: Date.now() - 45000, lastTranscript: Date.now() - 45000, topic: 'Documentation', facilitatorName: 'Jenny L.', trackId: 't2' },
  { id: '2H55R9', eventId: 'evt1', name: 'Table B2', session: 'Session 2: Pricing', status: TableStatus.ACTIVE, lastAudio: Date.now(), lastTranscript: Date.now() - 1000, topic: 'Enterprise Tier', facilitatorName: 'David K.', trackId: 't2' },
  { id: '4W77Q1', eventId: 'evt1', name: 'Table C1', session: 'Session 2: Pricing', status: TableStatus.OFFLINE, lastAudio: Date.now() - 120000, lastTranscript: Date.now() - 125000, topic: 'Usage-based', facilitatorName: 'Chris P.', trackId: 't3' },
  // Event 2 Tables
  { id: '8K11M3', eventId: 'evt2', name: 'Table 1', session: 'Morning Feedback', status: TableStatus.ACTIVE, lastAudio: Date.now(), lastTranscript: Date.now(), topic: 'UX Pain Points', facilitatorName: 'Alex M.' },
];

export const MOCK_TRANSCRIPTS: TranscriptSegment[] = [
  { id: 'tr1', tableId: '7X92B1', timestamp: Date.now() - 60000, speaker: 'Speaker A', text: 'I feel like the documentation is too scattered. New hires get lost.', sentiment: -0.5 },
  { id: 'tr2', tableId: '7X92B1', timestamp: Date.now() - 55000, speaker: 'Speaker B', text: 'Agreed. We need a centralized portal. The wiki is a mess.', sentiment: -0.4 },
  { id: 'tr3', tableId: '3M88K2', timestamp: Date.now() - 40000, speaker: 'Speaker C', text: 'Our onboarding improved when we assigned a buddy for the first week.', sentiment: 0.8 },
  { id: 'tr4', tableId: '2H55R9', timestamp: Date.now() - 30000, speaker: 'Speaker A', text: 'The enterprise tier is too expensive for mid-market clients.', sentiment: -0.6 },
  { id: 'tr5', tableId: '2H55R9', timestamp: Date.now() - 20000, speaker: 'Speaker B', text: 'But the support SLA is what they are paying for.', sentiment: 0.2 },
  { id: 'tr6', tableId: '7X92B1', timestamp: Date.now() - 10000, speaker: 'Speaker A', text: 'Can we automate the account setup? It takes IT three days.', sentiment: -0.7 },
  { id: 'tr7', tableId: '3M88K2', timestamp: Date.now() - 5000, speaker: 'Speaker D', text: 'Does anyone have a checklist template we can share?', sentiment: 0.1 },
  // Sponsor Keywords
  { id: 'tr8', tableId: '7X92B1', timestamp: Date.now() - 100000, speaker: 'Speaker B', text: 'We are looking at Cloud migration strategies for next year.', sentiment: 0.6 },
  { id: 'tr9', tableId: '2H55R9', timestamp: Date.now() - 90000, speaker: 'Speaker A', text: 'Security is the main blocker for cloud adoption right now.', sentiment: -0.3 },
  { id: 'tr10', tableId: '3M88K2', timestamp: Date.now() - 80000, speaker: 'Speaker C', text: 'If we can fix the compliance issues, the cloud is a no-brainer.', sentiment: 0.5 },
];

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'in5',
    type: InsightType.GOLDEN_NUGGET,
    title: 'Perfect Analogy for Tech Debt',
    description: 'Facilitator marked this: "It is like paying interest on a loan you never signed up for." Great soundbite.',
    confidence: 1.0,
    relatedTableIds: ['3M88K2'],
    evidenceCount: 1,
    timestamp: Date.now() - 5000
  },
  {
    id: 'in1',
    type: InsightType.THEME,
    title: 'Fragmentation of Knowledge',
    description: 'Multiple tables reporting that onboarding documentation is scattered across too many tools (Wiki, Drive, Slack).',
    confidence: 0.92,
    relatedTableIds: ['7X92B1', '9L22P4'],
    evidenceCount: 14,
    timestamp: Date.now() - 300000
  },
  {
    id: 'in2',
    type: InsightType.ACTION_ITEM,
    title: 'Automate Account Provisioning',
    description: 'Investigate IT automation tools to reduce 3-day wait time for new accounts.',
    confidence: 0.88,
    relatedTableIds: ['7X92B1'],
    evidenceCount: 3,
    timestamp: Date.now() - 120000
  },
  {
    id: 'in3',
    type: InsightType.SENTIMENT_SPIKE,
    title: 'Confusion on Enterprise Pricing',
    description: 'Sudden drop in sentiment at Table B2 regarding mid-market fit.',
    confidence: 0.75,
    relatedTableIds: ['2H55R9'],
    evidenceCount: 5,
    timestamp: Date.now() - 60000
  },
  {
    id: 'in4',
    type: InsightType.QUESTION,
    title: 'Checklist Availability',
    description: 'Are there standard templates for manager checklists?',
    confidence: 0.95,
    relatedTableIds: ['3M88K2'],
    evidenceCount: 2,
    timestamp: Date.now() - 15000
  }
];
