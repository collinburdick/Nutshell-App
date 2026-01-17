import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { 
  users, events, tables, tracks, facilitators, sponsors, 
  transcripts, insights, agendaItems, notices, attendeeQuestions 
} from "../shared/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import QRCode from "qrcode";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

const clients = new Map<string, WebSocket>();

wss.on("connection", (ws, req) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  
  ws.on("close", () => {
    clients.delete(clientId);
  });
});

function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const openai = process.env.SlalomOpenAIAPIKey 
  ? new OpenAI({ apiKey: process.env.SlalomOpenAIAPIKey })
  : null;

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const [user] = await db.insert(users).values(req.body).returning();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const allEvents = await db.query.events.findMany({
      with: {
        tracks: true,
        facilitators: true,
        sponsors: true,
        agendaItems: {
          where: (items, { isNull }) => isNull(items.tableId),
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
      },
      orderBy: [desc(events.createdAt)],
    });
    
    const eventsWithCounts = await Promise.all(allEvents.map(async (event) => {
      const tableCount = await db.select({ count: sql<number>`count(*)` })
        .from(tables)
        .where(eq(tables.eventId, event.id));
      
      return {
        ...event,
        tablesCount: Number(tableCount[0]?.count || 0),
        sessionsCount: event.tracks.length || 1,
      };
    }));
    
    res.json(eventsWithCounts);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const { name, startDate, endDate, location, status, privacyMode, primaryColor, logoUrl } = req.body;
    
    const [event] = await db.insert(events).values({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      status: status || 'UPCOMING',
      privacyMode: privacyMode || 'STRICT',
      primaryColor: primaryColor || '#6366f1',
      logoUrl,
    }).returning();
    
    const defaultAgenda = [
      { phase: 'Intro', text: 'Kick off by asking everyone to introduce themselves and their role.', durationMinutes: 5, sortOrder: 0 },
      { phase: 'Discovery', text: 'What is the single biggest friction point in your first week?', durationMinutes: 15, sortOrder: 1 },
      { phase: 'Deep Dive', text: 'How do you currently handle knowledge sharing? What tools do you use?', durationMinutes: 20, sortOrder: 2 },
      { phase: 'Wrap Up', text: 'If you had a magic wand, what one thing would you fix immediately?', durationMinutes: 5, sortOrder: 3 },
    ];
    
    for (const item of defaultAgenda) {
      await db.insert(agendaItems).values({ ...item, eventId: event.id });
    }
    
    res.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        tracks: true,
        facilitators: true,
        sponsors: true,
        agendaItems: {
          where: (items, { isNull }) => isNull(items.tableId),
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
      },
    });
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    const tableCount = await db.select({ count: sql<number>`count(*)` })
      .from(tables)
      .where(eq(tables.eventId, eventId));
    
    res.json({
      ...event,
      tablesCount: Number(tableCount[0]?.count || 0),
      sessionsCount: event.tracks.length || 1,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const [updated] = await db.update(events)
      .set(req.body)
      .where(eq(events.id, eventId))
      .returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    await db.delete(events).where(eq(events.id, eventId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.get("/api/events/:eventId/tables", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const eventTables = await db.query.tables.findMany({
      where: eq(tables.eventId, eventId),
      with: {
        facilitator: true,
        track: true,
        agendaItems: {
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
      },
    });
    res.json(eventTables);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

app.post("/api/events/:eventId/tables", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { name, session, topic, facilitatorId, trackId } = req.body;
    
    const [table] = await db.insert(tables).values({
      eventId,
      joinCode: generateJoinCode(),
      name,
      session,
      topic,
      facilitatorId,
      trackId,
      status: 'OFFLINE',
    }).returning();
    
    broadcast("table_created", table);
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: "Failed to create table" });
  }
});

app.put("/api/tables/:id", async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const [updated] = await db.update(tables)
      .set(req.body)
      .where(eq(tables.id, tableId))
      .returning();
    
    broadcast("table_updated", updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update table" });
  }
});

app.delete("/api/tables/:id", async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    await db.delete(tables).where(eq(tables.id, tableId));
    broadcast("table_deleted", { id: tableId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete table" });
  }
});

app.get("/api/tables/:joinCode/join", async (req, res) => {
  try {
    const { joinCode } = req.params;
    const table = await db.query.tables.findFirst({
      where: eq(tables.joinCode, joinCode.toUpperCase()),
      with: {
        event: {
          with: {
            agendaItems: {
              where: (items, { isNull }) => isNull(items.tableId),
              orderBy: (items, { asc }) => [asc(items.sortOrder)],
            },
          },
        },
        agendaItems: {
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
      },
    });
    
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    await db.update(tables)
      .set({ status: 'ACTIVE', lastAudio: new Date() })
      .where(eq(tables.id, table.id));
    
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: "Failed to join table" });
  }
});

app.get("/api/events/:eventId/transcripts", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const tableIds = await db.select({ id: tables.id })
      .from(tables)
      .where(eq(tables.eventId, eventId));
    
    if (tableIds.length === 0) {
      return res.json([]);
    }
    
    const allTranscripts = await db.select()
      .from(transcripts)
      .where(inArray(transcripts.tableId, tableIds.map(t => t.id)))
      .orderBy(desc(transcripts.timestamp));
    
    res.json(allTranscripts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transcripts" });
  }
});

app.get("/api/tables/:tableId/transcripts", async (req, res) => {
  try {
    const tableId = parseInt(req.params.tableId);
    const tableTranscripts = await db.select()
      .from(transcripts)
      .where(eq(transcripts.tableId, tableId))
      .orderBy(desc(transcripts.timestamp));
    res.json(tableTranscripts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transcripts" });
  }
});

app.post("/api/tables/:tableId/transcripts", async (req, res) => {
  try {
    const tableId = parseInt(req.params.tableId);
    const { speaker, text, isQuote } = req.body;
    
    let sentiment = 0;
    if (openai && text) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a sentiment analyzer. Respond with only a number between -1 and 1 representing the sentiment of the text. -1 is very negative, 0 is neutral, 1 is very positive." },
            { role: "user", content: text }
          ],
          max_tokens: 10,
        });
        sentiment = parseFloat(response.choices[0]?.message?.content || "0") || 0;
      } catch (e) {
        console.error("Sentiment analysis failed:", e);
      }
    }
    
    const [transcript] = await db.insert(transcripts).values({
      tableId,
      speaker,
      text,
      sentiment,
      isQuote,
      timestamp: new Date(),
    }).returning();
    
    await db.update(tables)
      .set({ lastTranscript: new Date(), lastAudio: new Date() })
      .where(eq(tables.id, tableId));
    
    broadcast("transcript_added", transcript);
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ error: "Failed to add transcript" });
  }
});

app.get("/api/events/:eventId/insights", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const eventInsights = await db.select()
      .from(insights)
      .where(eq(insights.eventId, eventId))
      .orderBy(desc(insights.createdAt));
    res.json(eventInsights);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

app.post("/api/events/:eventId/insights", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [insight] = await db.insert(insights).values({
      ...req.body,
      eventId,
    }).returning();
    
    broadcast("insight_added", insight);
    res.json(insight);
  } catch (error) {
    res.status(500).json({ error: "Failed to create insight" });
  }
});

app.put("/api/insights/:id", async (req, res) => {
  try {
    const insightId = parseInt(req.params.id);
    const [updated] = await db.update(insights)
      .set(req.body)
      .where(eq(insights.id, insightId))
      .returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update insight" });
  }
});

app.post("/api/events/:eventId/generate-insights", async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: "OpenAI not configured" });
  }
  
  try {
    const eventId = parseInt(req.params.eventId);
    
    const tableIds = await db.select({ id: tables.id })
      .from(tables)
      .where(eq(tables.eventId, eventId));
    
    if (tableIds.length === 0) {
      return res.json([]);
    }
    
    const recentTranscripts = await db.select()
      .from(transcripts)
      .where(inArray(transcripts.tableId, tableIds.map(t => t.id)))
      .orderBy(desc(transcripts.timestamp))
      .limit(100);
    
    if (recentTranscripts.length === 0) {
      return res.json([]);
    }
    
    const transcriptText = recentTranscripts.map(t => 
      `[Table ${t.tableId}] ${t.speaker || 'Unknown'}: ${t.text}`
    ).join("\n");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are an AI analyst for a conference intelligence platform. Analyze transcripts and extract insights in JSON format.
          
Return an array of insights with this structure:
[
  {
    "type": "THEME" | "ACTION_ITEM" | "QUESTION" | "SENTIMENT_SPIKE" | "GOLDEN_NUGGET",
    "title": "Brief title",
    "description": "Detailed description",
    "confidence": 0.0-1.0,
    "relatedTableIds": [table IDs as numbers],
    "evidenceCount": number of supporting statements
  }
]

Focus on:
- THEME: Recurring topics across multiple tables
- ACTION_ITEM: Specific tasks or follow-ups mentioned
- QUESTION: Questions that need answering
- SENTIMENT_SPIKE: Notable positive or negative reactions
- GOLDEN_NUGGET: Quotable moments or key insights`
        },
        { role: "user", content: transcriptText }
      ],
      response_format: { type: "json_object" },
    });
    
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{"insights": []}');
    const insightList = parsed.insights || parsed;
    
    const savedInsights = [];
    for (const insight of insightList) {
      const [saved] = await db.insert(insights).values({
        eventId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence || 0.8,
        relatedTableIds: insight.relatedTableIds || [],
        evidenceCount: insight.evidenceCount || 1,
        status: 'PENDING',
      }).returning();
      savedInsights.push(saved);
    }
    
    broadcast("insights_generated", savedInsights);
    res.json(savedInsights);
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

app.get("/api/events/:eventId/tracks", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const eventTracks = await db.select()
      .from(tracks)
      .where(eq(tracks.eventId, eventId));
    res.json(eventTracks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.post("/api/events/:eventId/tracks", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [track] = await db.insert(tracks).values({
      ...req.body,
      eventId,
    }).returning();
    res.json(track);
  } catch (error) {
    res.status(500).json({ error: "Failed to create track" });
  }
});

app.delete("/api/tracks/:id", async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    await db.delete(tracks).where(eq(tracks.id, trackId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete track" });
  }
});

app.get("/api/events/:eventId/facilitators", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const eventFacilitators = await db.select()
      .from(facilitators)
      .where(eq(facilitators.eventId, eventId));
    res.json(eventFacilitators);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch facilitators" });
  }
});

app.post("/api/events/:eventId/facilitators", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [facilitator] = await db.insert(facilitators).values({
      ...req.body,
      eventId,
    }).returning();
    res.json(facilitator);
  } catch (error) {
    res.status(500).json({ error: "Failed to create facilitator" });
  }
});

app.get("/api/events/:eventId/sponsors", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const eventSponsors = await db.select()
      .from(sponsors)
      .where(eq(sponsors.eventId, eventId));
    res.json(eventSponsors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sponsors" });
  }
});

app.post("/api/events/:eventId/sponsors", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [sponsor] = await db.insert(sponsors).values({
      ...req.body,
      eventId,
    }).returning();
    res.json(sponsor);
  } catch (error) {
    res.status(500).json({ error: "Failed to create sponsor" });
  }
});

app.delete("/api/sponsors/:id", async (req, res) => {
  try {
    const sponsorId = parseInt(req.params.id);
    await db.delete(sponsors).where(eq(sponsors.id, sponsorId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete sponsor" });
  }
});

app.post("/api/events/:eventId/broadcast", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { message, tableIds } = req.body;
    
    const savedNotices = [];
    
    if (tableIds && tableIds.length > 0) {
      for (const tableId of tableIds) {
        const [notice] = await db.insert(notices).values({
          eventId,
          tableId,
          message,
        }).returning();
        savedNotices.push(notice);
      }
    } else {
      const [notice] = await db.insert(notices).values({
        eventId,
        message,
      }).returning();
      savedNotices.push(notice);
    }
    
    broadcast("notice", { eventId, tableIds, message });
    res.json(savedNotices);
  } catch (error) {
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

app.get("/api/tables/:tableId/notices", async (req, res) => {
  try {
    const tableId = parseInt(req.params.tableId);
    const tableNotices = await db.select()
      .from(notices)
      .where(and(
        eq(notices.tableId, tableId),
        eq(notices.isRead, false)
      ))
      .orderBy(desc(notices.createdAt));
    res.json(tableNotices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

app.post("/api/ai/query", async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: "OpenAI not configured. Please add SlalomOpenAIAPIKey." });
  }
  
  try {
    const { query, eventId } = req.body;
    
    const tableIds = await db.select({ id: tables.id })
      .from(tables)
      .where(eq(tables.eventId, eventId));
    
    let context = "";
    if (tableIds.length > 0) {
      const recentTranscripts = await db.select()
        .from(transcripts)
        .where(inArray(transcripts.tableId, tableIds.map(t => t.id)))
        .orderBy(desc(transcripts.timestamp))
        .limit(100);
      
      context = recentTranscripts.map(t => 
        `[Table ${t.tableId}] ${t.speaker || 'Unknown'}: ${t.text}`
      ).join("\n");
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are an AI analyst for Nutshell, a conference intelligence platform.
Analyze the following transcript segments from a live event.

Instructions:
1. Answer the query based ONLY on the provided transcript data.
2. If the data supports it, provide a direct answer or summary.
3. Cite specific tables and speakers in your answer.
4. If the answer is not found in the transcripts, state that there is no evidence.
5. Format your response in Markdown.`
        },
        { role: "user", content: `Transcript Data:\n${context || "No transcripts available yet."}\n\nQuery: ${query}` }
      ],
    });
    
    res.json({ answer: response.choices[0]?.message?.content || "No response generated." });
  } catch (error) {
    console.error("AI query error:", error);
    res.status(500).json({ error: "Failed to process query" });
  }
});

app.post("/api/ai/coach-tip", async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: "OpenAI not configured" });
  }
  
  try {
    const { tableId, agenda } = req.body;
    
    const recentTranscripts = await db.select()
      .from(transcripts)
      .where(eq(transcripts.tableId, tableId))
      .orderBy(desc(transcripts.timestamp))
      .limit(20);
    
    const transcriptText = recentTranscripts.map(t => `${t.speaker}: ${t.text}`).join("\n");
    const agendaText = agenda?.map((a: any) => `${a.phase}: ${a.text}`).join("\n") || "";
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are a facilitator coach. Based on the discussion so far and the agenda, suggest one brief tip to help the facilitator. Keep it to 1-2 sentences. Focus on topics that haven't been covered or questions that could deepen the discussion.`
        },
        { role: "user", content: `Agenda:\n${agendaText}\n\nRecent Discussion:\n${transcriptText || "Discussion just started."}` }
      ],
      max_tokens: 100,
    });
    
    res.json({ tip: response.choices[0]?.message?.content || "Keep the conversation flowing!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate tip" });
  }
});

app.get("/api/events/:eventId/sentiment-data", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    const tableIds = await db.select({ id: tables.id })
      .from(tables)
      .where(eq(tables.eventId, eventId));
    
    if (tableIds.length === 0) {
      return res.json([]);
    }
    
    const sentimentData = await db.select({
      timestamp: transcripts.timestamp,
      sentiment: transcripts.sentiment,
    })
      .from(transcripts)
      .where(inArray(transcripts.tableId, tableIds.map(t => t.id)))
      .orderBy(transcripts.timestamp);
    
    const buckets: { [key: string]: number[] } = {};
    sentimentData.forEach(d => {
      if (d.timestamp) {
        const key = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(d.sentiment || 0);
      }
    });
    
    const chartData = Object.entries(buckets).map(([time, values]) => ({
      time,
      sentiment: values.reduce((a, b) => a + b, 0) / values.length,
    }));
    
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sentiment data" });
  }
});

app.get("/api/events/:eventId/sponsor-stats/:sponsorId", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const sponsorId = parseInt(req.params.sponsorId);
    
    const sponsor = await db.query.sponsors.findFirst({
      where: eq(sponsors.id, sponsorId),
    });
    
    if (!sponsor || !sponsor.keywords) {
      return res.json({ keywords: [], totalMentions: 0, avgSentiment: 0 });
    }
    
    const tableIds = await db.select({ id: tables.id })
      .from(tables)
      .where(eq(tables.eventId, eventId));
    
    if (tableIds.length === 0) {
      return res.json({ keywords: sponsor.keywords.map(k => ({ keyword: k, count: 0, sentiment: 0 })), totalMentions: 0, avgSentiment: 0 });
    }
    
    const allTranscripts = await db.select()
      .from(transcripts)
      .where(inArray(transcripts.tableId, tableIds.map(t => t.id)));
    
    const keywordStats = (sponsor.keywords as string[]).map(keyword => {
      const mentions = allTranscripts.filter(t => 
        t.text.toLowerCase().includes(keyword.toLowerCase())
      );
      return {
        keyword,
        count: mentions.length,
        sentiment: mentions.length > 0 
          ? mentions.reduce((acc, m) => acc + (m.sentiment || 0), 0) / mentions.length 
          : 0,
      };
    });
    
    const totalMentions = keywordStats.reduce((acc, k) => acc + k.count, 0);
    const avgSentiment = keywordStats.length > 0
      ? keywordStats.reduce((acc, k) => acc + k.sentiment, 0) / keywordStats.length
      : 0;
    
    res.json({ keywords: keywordStats, totalMentions, avgSentiment });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sponsor stats" });
  }
});

app.get("/api/tables/:id/qrcode", async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await db.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });
    
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    const qrDataUrl = await QRCode.toDataURL(table.joinCode, {
      width: 200,
      margin: 2,
    });
    
    res.json({ qrCode: qrDataUrl, joinCode: table.joinCode });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

app.post("/api/events/:eventId/questions", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { question, askedBy, isAnonymous } = req.body;
    
    const [saved] = await db.insert(attendeeQuestions).values({
      eventId,
      question,
      askedBy: isAnonymous ? null : askedBy,
      isAnonymous: isAnonymous ?? true,
    }).returning();
    
    broadcast("question_added", saved);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit question" });
  }
});

app.get("/api/events/:eventId/questions", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const questions = await db.select()
      .from(attendeeQuestions)
      .where(eq(attendeeQuestions.eventId, eventId))
      .orderBy(desc(attendeeQuestions.votes), desc(attendeeQuestions.createdAt));
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
