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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPageSchema = createInsertSchema(pagesTable).omit({ id: true, createdAt: true });
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pagesTable.$inferSelect;
