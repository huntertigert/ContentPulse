import { Router, type IRouter } from "express";
import { db, pagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePageBody,
  UploadCsvBody,
  DeletePageParams,
} from "@workspace/api-zod";
import { calculateFreshness } from "../lib/freshness.js";

const router: IRouter = Router();

// GET /pages/stats — must be before /pages/:id
router.get("/stats", async (_req, res) => {
  try {
    const pages = await db.select().from(pagesTable);

    if (pages.length === 0) {
      res.json({
        totalPages: 0,
        freshPercent: 0,
        criticalCount: 0,
        reviewCount: 0,
        healthyCount: 0,
        avgFreshnessScore: 0,
        aiCitationReadyCount: 0,
      });
      return;
    }

    const now = new Date();
    let criticalCount = 0;
    let reviewCount = 0;
    let healthyCount = 0;
    let freshCount = 0;
    let aiCitationReadyCount = 0;
    let totalFreshness = 0;

    for (const page of pages) {
      const data = calculateFreshness(page);
      const daysSinceUpdate = Math.floor(
        (now.getTime() - page.lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (data.triageStatus === "critical") criticalCount++;
      else if (data.triageStatus === "review") reviewCount++;
      else healthyCount++;

      if (daysSinceUpdate <= 90) freshCount++;
      if (data.aiCitationLikely) aiCitationReadyCount++;

      totalFreshness += data.freshnessScore;
    }

    const freshPercent = Math.round((freshCount / pages.length) * 100);
    const avgFreshnessScore = Math.round(totalFreshness / pages.length);

    res.json({
      totalPages: pages.length,
      freshPercent,
      criticalCount,
      reviewCount,
      healthyCount,
      avgFreshnessScore,
      aiCitationReadyCount,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /pages
router.get("/", async (_req, res) => {
  try {
    const pages = await db.select().from(pagesTable);
    const result = pages.map(calculateFreshness);
    // Sort by decay score descending
    result.sort((a, b) => b.decayScore - a.decayScore);
    res.json(result);
  } catch (err) {
    console.error("Error fetching pages:", err);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

// POST /pages
router.post("/", async (req, res) => {
  try {
    const body = CreatePageBody.parse(req.body);
    const [inserted] = await db
      .insert(pagesTable)
      .values({
        url: body.url,
        title: body.title,
        lastUpdated: new Date(body.lastUpdated),
        clicks30d: body.clicks30d,
        clicksPrev30d: body.clicksPrev30d,
        wordCount: body.wordCount,
        excerpt: body.excerpt,
      })
      .returning();

    res.status(201).json(calculateFreshness(inserted));
  } catch (err) {
    console.error("Error creating page:", err);
    res.status(400).json({ error: "Invalid input" });
  }
});

// POST /pages/upload-csv
router.post("/upload-csv", async (req, res) => {
  try {
    const body = UploadCsvBody.parse(req.body);
    const lines = body.csvData.trim().split("\n");

    if (lines.length < 2) {
      res.json({ imported: 0, skipped: 0, errors: ["CSV must have a header row and at least one data row"] });
      return;
    }

    // Parse header — flexible column matching for WordPress, GSC, and custom exports
    const rawHeader = parseCsvLine(lines[0]);
    const header = rawHeader.map((h) =>
      h.trim().toLowerCase().replace(/['"]/g, "").replace(/\s+/g, " "),
    );

    const findCol = (variants: string[]) =>
      header.findIndex((h) => variants.includes(h));

    const urlIdx = findCol([
      "url", "page", "address", "link", "permalink", "landing page",
      "top pages", "page url", "post url", "slug",
    ]);
    const titleIdx = findCol([
      "title", "post title", "post_title", "name", "page title", "page name",
    ]);
    const lastUpdatedIdx = findCol([
      "lastupdated", "last_updated", "last updated", "modified", "date modified",
      "date_modified", "post modified", "post_modified", "post modified date",
      "modified date", "last modified", "updated", "updated_at", "modified_at",
      "post date", "post_date", "date", "published", "published_at", "published date",
    ]);
    const clicks30dIdx = findCol([
      "clicks30d", "clicks_30d", "clicks", "pageviews", "page views",
      "sessions", "visits", "traffic",
    ]);
    const clicksPrev30dIdx = findCol([
      "clicksprev30d", "clicks_prev_30d", "prev_clicks", "prevclicks",
      "previous clicks", "last period clicks", "prior clicks",
    ]);
    const wordCountIdx = findCol([
      "wordcount", "word_count", "word count", "words",
    ]);
    const excerptIdx = findCol([
      "excerpt", "description", "snippet", "content", "meta description",
      "post excerpt",
    ]);

    if (urlIdx === -1) {
      res.json({
        imported: 0,
        skipped: 0,
        errors: [
          `Could not find a URL column. Found columns: ${header.join(", ")}. ` +
          `Expected one of: url, page, address, link, permalink.`,
        ],
      });
      return;
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV split (handles basic quoting)
      const cols = parseCsvLine(line);

      try {
        const url = cols[urlIdx]?.trim();

        if (!url) {
          errors.push(`Row ${i}: missing URL`);
          skipped++;
          continue;
        }

        // lastUpdated is optional — fall back to today if column not found or blank
        const lastUpdatedRaw = lastUpdatedIdx !== -1 ? cols[lastUpdatedIdx]?.trim() : "";
        let lastUpdated: Date;
        if (lastUpdatedRaw) {
          lastUpdated = new Date(lastUpdatedRaw);
          if (isNaN(lastUpdated.getTime())) {
            // Try common WP format: "2024-06-01 14:30:00"
            lastUpdated = new Date(lastUpdatedRaw.replace(" ", "T"));
          }
          if (isNaN(lastUpdated.getTime())) {
            errors.push(`Row ${i}: could not parse date "${lastUpdatedRaw}", using today`);
            lastUpdated = new Date();
          }
        } else {
          lastUpdated = new Date();
        }

        const clicks30d = clicks30dIdx !== -1 ? parseInt(cols[clicks30dIdx] ?? "0") || 0 : 0;
        const clicksPrev30d = clicksPrev30dIdx !== -1 ? parseInt(cols[clicksPrev30dIdx] ?? "0") || 0 : 0;
        const wordCount = wordCountIdx !== -1 ? parseInt(cols[wordCountIdx] ?? "0") || 0 : 0;
        const title = titleIdx !== -1 ? cols[titleIdx]?.trim() || null : null;
        const excerpt = excerptIdx !== -1 ? cols[excerptIdx]?.trim() || null : null;

        await db.insert(pagesTable).values({
          url,
          title,
          lastUpdated,
          clicks30d,
          clicksPrev30d,
          wordCount,
          excerpt,
        });

        imported++;
      } catch (rowErr) {
        errors.push(`Row ${i}: ${String(rowErr)}`);
        skipped++;
      }
    }

    res.json({ imported, skipped, errors });
  } catch (err) {
    console.error("Error uploading CSV:", err);
    res.status(400).json({ error: "Invalid input" });
  }
});

// DELETE /pages/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeletePageParams.parse({ id: req.params.id });
    await db.delete(pagesTable).where(eq(pagesTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting page:", err);
    res.status(400).json({ error: "Invalid input" });
  }
});

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cols.push(current.replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.replace(/^"|"$/g, ""));
  return cols;
}

export default router;
