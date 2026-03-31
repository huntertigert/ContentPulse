import { pgTable, serial, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pagesTable = pgTable("pages", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  lastUpdated: timestamp("last_updated").notNull(),
  clicks30d: integer("clicks_30d").notNull().default(0),
  clicksPrev30d: integer("clicks_prev_30d").notNull().default(0),
  wordCount: integer("word_count").notNull().default(0),
  excerpt: text("excerpt"),
  aiCitationScore: integer("ai_citation_score"),
  aiCitationReason: text("ai_citation_reason"),
  semrushKeywords: integer("semrush_keywords"),
  semrushTopKeyword: text("semrush_top_keyword"),
  semrushTopPosition: integer("semrush_top_position"),
  semrushVolume: integer("semrush_volume"),
  semrushKd: real("semrush_kd"),
  semrushKeywordList: text("semrush_keyword_list"),
  workflowStatus: text("workflow_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPageSchema = createInsertSchema(pagesTable).omit({ id: true, createdAt: true });
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pagesTable.$inferSelect;
