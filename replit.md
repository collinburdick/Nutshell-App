# Nutshell Command Center

## Overview
A React-based event management dashboard application for managing sessions, facilitators, and monitoring live intelligence.

## Project Structure
- `App.tsx` - Main application component
- `index.tsx` - React entry point
- `index.html` - HTML template with Tailwind CSS
- `components/` - React UI components
  - `Dashboard.tsx` - Main dashboard view
  - `EventList.tsx` - Event listing component
  - `FacilitatorScreen.tsx` - Facilitator management
  - `AttendeeView.tsx` - Attendee view
  - `SettingsView.tsx` - Settings panel
  - Other UI components for various features
- `services/` - API service layer
  - `geminiService.ts` - Gemini AI integration
- `types.ts` - TypeScript type definitions
- `constants.ts` - Application constants

## Tech Stack
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS (via CDN) for styling
- Recharts for data visualization
- Lucide React for icons
- Google Gemini AI integration

## Development
```bash
npm install
npm run dev
```
The development server runs on port 5000.

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (optional, for AI features)

## Recent Changes
- Jan 17, 2026: Initial Replit setup, configured for port 5000 with proxy support
