import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'FACILITATOR', 'ATTENDEE', 'SPONSOR']);
export const eventStatusEnum = pgEnum('event_status', ['UPCOMING', 'LIVE', 'COMPLETED']);
export const tableStatusEnum = pgEnum('table_status', ['ACTIVE', 'DEGRADED', 'OFFLINE']);
export const insightTypeEnum = pgEnum('insight_type', ['THEME', 'ACTION_ITEM', 'QUESTION', 'SENTIMENT_SPIKE', 'GOLDEN_NUGGET']);
export const privacyModeEnum = pgEnum('privacy_mode', ['STRICT', 'BALANCED', 'OFF']);
export const sessionStatusEnum = pgEnum('session_status', ['IDLE', 'RECORDING', 'COMPLETED']);
export const facilitatorStatusEnum = pgEnum('facilitator_status', ['INVITED', 'ACTIVE', 'INACTIVE']);
export const insightStatusEnum = pgEnum('insight_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  role: userRoleEnum("role").notNull().default('ATTENDEE'),
  replitId: text("replit_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  status: eventStatusEnum("status").notNull().default('UPCOMING'),
  privacyMode: privacyModeEnum("privacy_mode").notNull().default('STRICT'),
  primaryColor: text("primary_color").default('#6366f1'),
  logoUrl: text("logo_url"),
  eventNameOverride: text("event_name_override"),
  mainSessionStatus: sessionStatusEnum("main_session_status").default('IDLE'),
  mainSessionStartTime: timestamp("main_session_start_time"),
  mainSessionDuration: integer("main_session_duration").default(0),
  streamUrl: text("stream_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  name: text("name").notNull(),
  color: text("color").default('#6366f1'),
});

export const facilitators = pgTable("facilitators", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  status: facilitatorStatusEnum("status").notNull().default('INVITED'),
  assignedTableId: integer("assigned_table_id"),
});

export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  userId: integer("user_id").references(() => users.id),
});

export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  joinCode: varchar("join_code", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  session: text("session"),
  status: tableStatusEnum("status").notNull().default('OFFLINE'),
  lastAudio: timestamp("last_audio"),
  lastTranscript: timestamp("last_transcript"),
  topic: text("topic"),
  facilitatorId: integer("facilitator_id").references(() => facilitators.id),
  trackId: integer("track_id").references(() => tracks.id),
  isHot: boolean("is_hot").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agendaItems = pgTable("agenda_items", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  tableId: integer("table_id").references(() => tables.id),
  phase: text("phase").notNull(),
  text: text("text").notNull(),
  durationMinutes: integer("duration_minutes").default(10),
  sortOrder: integer("sort_order").default(0),
});

export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => tables.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  speaker: text("speaker"),
  text: text("text").notNull(),
  sentiment: real("sentiment").default(0),
  isQuote: boolean("is_quote").default(false),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  type: insightTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  confidence: real("confidence").default(0.8),
  relatedTableIds: jsonb("related_table_ids").$type<number[]>().default([]),
  evidenceCount: integer("evidence_count").default(0),
  status: insightStatusEnum("status").default('PENDING'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  tableId: integer("table_id").references(() => tables.id),
  message: text("message").notNull(),
  sentById: integer("sent_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false),
});

export const attendeeQuestions = pgTable("attendee_questions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  question: text("question").notNull(),
  askedBy: text("asked_by"),
  isAnonymous: boolean("is_anonymous").default(true),
  votes: integer("votes").default(0),
  answered: boolean("answered").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ many, one }) => ({
  tracks: many(tracks),
  tables: many(tables),
  facilitators: many(facilitators),
  sponsors: many(sponsors),
  insights: many(insights),
  agendaItems: many(agendaItems),
  notices: many(notices),
  attendeeQuestions: many(attendeeQuestions),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  event: one(events, {
    fields: [tracks.eventId],
    references: [events.id],
  }),
  tables: many(tables),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  event: one(events, {
    fields: [tables.eventId],
    references: [events.id],
  }),
  facilitator: one(facilitators, {
    fields: [tables.facilitatorId],
    references: [facilitators.id],
  }),
  track: one(tracks, {
    fields: [tables.trackId],
    references: [tracks.id],
  }),
  transcripts: many(transcripts),
  agendaItems: many(agendaItems),
}));

export const facilitatorsRelations = relations(facilitators, ({ one, many }) => ({
  event: one(events, {
    fields: [facilitators.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [facilitators.userId],
    references: [users.id],
  }),
  tables: many(tables),
}));

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  event: one(events, {
    fields: [sponsors.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [sponsors.userId],
    references: [users.id],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  table: one(tables, {
    fields: [transcripts.tableId],
    references: [tables.id],
  }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  event: one(events, {
    fields: [insights.eventId],
    references: [events.id],
  }),
}));

export const agendaItemsRelations = relations(agendaItems, ({ one }) => ({
  event: one(events, {
    fields: [agendaItems.eventId],
    references: [events.id],
  }),
  table: one(tables, {
    fields: [agendaItems.tableId],
    references: [tables.id],
  }),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  event: one(events, {
    fields: [notices.eventId],
    references: [events.id],
  }),
  table: one(tables, {
    fields: [notices.tableId],
    references: [tables.id],
  }),
  sentBy: one(users, {
    fields: [notices.sentById],
    references: [users.id],
  }),
}));

export const attendeeQuestionsRelations = relations(attendeeQuestions, ({ one }) => ({
  event: one(events, {
    fields: [attendeeQuestions.eventId],
    references: [events.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;
export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;
export type Facilitator = typeof facilitators.$inferSelect;
export type InsertFacilitator = typeof facilitators.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = typeof sponsors.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertTranscript = typeof transcripts.$inferInsert;
export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;
export type AgendaItem = typeof agendaItems.$inferSelect;
export type InsertAgendaItem = typeof agendaItems.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;
export type AttendeeQuestion = typeof attendeeQuestions.$inferSelect;
export type InsertAttendeeQuestion = typeof attendeeQuestions.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const insertEventSchema = createInsertSchema(events);
export const insertTrackSchema = createInsertSchema(tracks);
export const insertTableSchema = createInsertSchema(tables);
export const insertFacilitatorSchema = createInsertSchema(facilitators);
export const insertSponsorSchema = createInsertSchema(sponsors);
export const insertTranscriptSchema = createInsertSchema(transcripts);
export const insertInsightSchema = createInsertSchema(insights);
export const insertAgendaItemSchema = createInsertSchema(agendaItems);
export const insertNoticeSchema = createInsertSchema(notices);
export const insertAttendeeQuestionSchema = createInsertSchema(attendeeQuestions);
