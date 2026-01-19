# Nutshell Command Center

## Overview
A conference intelligence platform that manages multi-table discussions, providing real-time transcription, AI-powered insights, sentiment analysis, facilitator coaching, and sponsor brand tracking across admin, facilitator, attendee, and sponsor user roles.

## Project Structure
- `App.tsx` - Main application component with role-based routing
- `index.tsx` - React entry point
- `index.html` - HTML template with Tailwind CSS
- `components/` - React UI components
  - `Dashboard.tsx` - Main admin dashboard
  - `EventList.tsx` - Event listing and management
  - `FacilitatorScreen.tsx` - Facilitator session view
  - `AttendeeView.tsx` - Attendee live recap view
  - `SponsorDashboard.tsx` - Sponsor analytics view
  - `Explore.tsx` - AI-powered transcript search
  - `LiveRecap.tsx` - Live event recap
  - `SettingsView.tsx` - Event settings panel
- `server/` - Express.js backend
  - `index.ts` - API server with REST endpoints and WebSocket
  - `db.ts` - Database connection with Drizzle ORM
- `shared/` - Shared code
  - `schema.ts` - Database schema definitions
- `services/` - Frontend services
  - `api.ts` - API client with REST and WebSocket
  - `typeConverters.ts` - Type conversion utilities
- `types.ts` - Frontend TypeScript type definitions
- `constants.ts` - Mock data (legacy, being replaced)

## Tech Stack
- React 19 with TypeScript
- Express.js backend with WebSocket support
- PostgreSQL database (Neon-backed on Replit)
- Drizzle ORM for type-safe database access
- OpenAI GPT-4o-mini for AI features
- Vite for build tooling
- Tailwind CSS (via CDN) for styling
- Recharts for data visualization
- Lucide React for icons

## Database Schema
11 tables supporting the full application:
- `users` - User accounts and roles
- `events` - Conference events
- `tables` - Discussion tables with join codes
- `tracks` - Event session tracks
- `facilitators` - Table facilitators
- `sponsors` - Event sponsors with keywords
- `transcripts` - Real-time transcription segments
- `insights` - AI-generated insights
- `agenda_items` - Default and custom agendas
- `notices` - Admin broadcasts to tables
- `attendee_questions` - Live Q&A questions

## API Endpoints
All endpoints are prefixed with `/api`:
- Events: CRUD operations, generate insights
- Tables: CRUD, join by code, QR codes
- Transcripts: Create with sentiment analysis
- Insights: CRUD, AI generation
- AI: Natural language queries, facilitator coaching
- Sponsors: Stats and keyword tracking
- WebSocket: Real-time updates at `/ws`

## Development
```bash
npm install
npm run dev
```
The development server runs on port 5000 (Vite) with backend on port 3001.
API requests are proxied from `/api` to the backend.

## Environment Variables
- `SlalomOpenAIAPIKey` - OpenAI API key for AI features (required for AI)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)

## User Roles
1. **Admin** - Full event management, dashboard, settings
2. **Facilitator** - Session management, coaching tips, notices
3. **Attendee** - Live recap view, Q&A participation
4. **Sponsor** - Brand impact analytics, keyword tracking

## Recent Changes
- Jan 17, 2026: Initial Replit setup
- Jan 17, 2026: PostgreSQL database schema created with Drizzle ORM
- Jan 17, 2026: Express.js backend API with full REST endpoints
- Jan 17, 2026: OpenAI integration using SlalomOpenAIAPIKey
- Jan 17, 2026: Frontend updated to fetch from API instead of mock data
- Jan 17, 2026: WebSocket real-time updates implemented
- Jan 18, 2026: Removed all mock data dependencies from components
  - Dashboard.tsx: Now fetches insights, transcripts, sentiment from API with WebSocket updates
  - FacilitatorScreen.tsx: Fetches action items from API, AI coach tips via /api/ai/coach-tip
  - LiveRecap.tsx: Fetches insights from API with real-time WebSocket updates
  - AttendeeView.tsx: Fetches insights from API, AI questions via /api/ai/query
  - SponsorDashboard.tsx: Fetches keyword stats from /api/events/:id/sponsor-stats/:sponsorId
  - EvidencePanel.tsx: Dynamic data capture meter based on session timing
- Jan 18, 2026: Deleted geminiService.ts (all AI now via backend OpenAI)
- Jan 18, 2026: Added table ID mapping utilities (createTableIdMapper) for proper join code handling
- Jan 18, 2026: Added Share Facilitator Codes feature - admins can share table join codes via copy, email, or SMS
- Jan 18, 2026: Replaced browser Web Speech API with OpenAI Whisper for reliable transcription
  - New /api/ai/transcribe endpoint accepts audio files and uses Whisper for speech-to-text
  - FacilitatorScreen records 10-second audio chunks using MediaRecorder API
  - Audio is sent to backend for OpenAI processing (no browser dependencies)
  - Sentiment analysis via GPT-4o-mini for each transcript
  - Visual processing indicators show recording/uploading/transcribing status
- Jan 19, 2026: Added plenary session recording with same capabilities as roundtables
  - Added isPlenaryTable field to tables schema
  - New /api/events/:id/plenary-table endpoint creates/fetches plenary table
  - New /api/events/:id/plenary-summary endpoint generates AI themes/insights/questions
  - Dashboard Main Stage now has full recording UI with audio transcription
  - Plenary sessions show Key Themes, Top Insights, and Open Questions panels
  - Plenary transcripts keep speaker names visible (no de-identification)
- Jan 19, 2026: Fixed WebSocket error display
  - Suppressed non-informative [object Event] errors
  - Improved reconnection feedback with cleaner logging

## ID Mapping
The application uses two ID systems:
- **Database IDs**: Numeric auto-increment IDs stored in PostgreSQL
- **Join Codes**: 6-character alphanumeric codes for tables (user-facing)

Frontend tables use `joinCode` as their `id` property, with `_dbId` storing the numeric ID.
Type converters provide mapping functions to reconcile these ID types in transcripts and insights.
