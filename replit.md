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
