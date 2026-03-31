import { Router, type IRouter } from "express";
import { db, pagesTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
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

// POST /pages/upload-semrush-csv
router.post("/upload-semrush-csv", async (req, res) => {
  try {
    const body = UploadCsvBody.parse(req.body);
    const lines = body.csvData.trim().split("\n");

    if (lines.length < 2) {
      res.json({ imported: 0, skipped: 0, matched: 0, errors: ["CSV must have a header row and at least one data row"] });
      return;
    }

    const rawHeader = parseCsvLine(lines[0]);
    const header = rawHeader.map((h) =>
      h.trim().toLowerCase().replace(/['"]/g, "").replace(/\s+/g, " "),
    );

    const findCol = (variants: string[]) =>
      header.findIndex((h) => variants.includes(h));

    const keywordIdx = findCol(["keyword", "query", "search query", "term"]);
    const positionIdx = findCol(["position", "pos", "rank", "ranking", "ranking position"]);
    const volumeIdx = findCol(["search volume", "volume", "search vol", "avg. monthly searches"]);
    const urlIdx = findCol(["url", "page", "page url", "landing page", "target url"]);
    const kdIdx = findCol(["keyword difficulty", "kd", "kd %", "difficulty", "keyword difficulty %"]);
    const trafficIdx = findCol(["traffic", "traffic (%)", "traffic %", "organic traffic"]);

    if (urlIdx === -1) {
      res.json({
        imported: 0,
        skipped: 0,
        matched: 0,
        errors: [`Could not find a URL column. Found columns: ${header.join(", ")}. Expected one of: url, page, landing page.`],
      });
      return;
    }

    if (keywordIdx === -1) {
      res.json({
        imported: 0,
        skipped: 0,
        matched: 0,
        errors: [`Could not find a Keyword column. Found columns: ${header.join(", ")}. Expected one of: keyword, query, term.`],
      });
      return;
    }

    interface KeywordEntry {
      keyword: string;
      position: number;
      volume: number;
      kd: number;
    }
    const urlData: Record<string, {
      entries: KeywordEntry[];
      bestPosition: number;
      totalVolume: number;
      topKeyword: string;
      topVolume: number;
      kdValues: number[];
    }> = {};

    let totalRows = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      totalRows++;

      const cols = parseCsvLine(line);
      try {
        const rawUrl = cols[urlIdx]?.trim();
        const keyword = cols[keywordIdx]?.trim();
        if (!rawUrl || !keyword) {
          errors.push(`Row ${i}: missing URL or keyword`);
          continue;
        }

        const url = rawUrl.replace(/\/$/, "");
        const position = positionIdx !== -1 ? parseInt(cols[positionIdx] ?? "0") || 0 : 0;
        const volume = volumeIdx !== -1 ? parseInt(cols[volumeIdx]?.replace(/,/g, "") ?? "0") || 0 : 0;
        const kd = kdIdx !== -1 ? parseFloat(cols[kdIdx]?.replace(/%/g, "") ?? "0") || 0 : 0;

        if (!urlData[url]) {
          urlData[url] = { entries: [], bestPosition: 999, totalVolume: 0, topKeyword: keyword, topVolume: 0, kdValues: [] };
        }

        const d = urlData[url];
        d.entries.push({ keyword, position, volume, kd });
        d.totalVolume += volume;
        if (position > 0 && position < d.bestPosition) d.bestPosition = position;
        if (volume > d.topVolume) {
          d.topVolume = volume;
          d.topKeyword = keyword;
        }
        if (kd > 0) d.kdValues.push(kd);
      } catch (rowErr) {
        errors.push(`Row ${i}: ${String(rowErr)}`);
      }
    }

    const allPages = await db.select().from(pagesTable);
    let matched = 0;
    const uniqueUrls = Object.keys(urlData).length;

    const canonicalize = (raw: string): string => {
      try {
        const parsed = new URL(raw.startsWith("http") ? raw : `https://placeholder.com${raw.startsWith("/") ? "" : "/"}${raw}`);
        const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
        const path = parsed.pathname.replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase();
        return `${host}${path}`;
      } catch {
        return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\?.*$/, "").replace(/#.*$/, "").replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase();
      }
    };

    const pagesByCanonical = new Map<string, typeof allPages[0]>();
    for (const p of allPages) {
      pagesByCanonical.set(canonicalize(p.url), p);
    }

    for (const [semrushUrl, data] of Object.entries(urlData)) {
      const key = canonicalize(semrushUrl);
      const matchedPage = pagesByCanonical.get(key);

      if (matchedPage) {
        const avgKd = data.kdValues.length > 0 ? Math.round(data.kdValues.reduce((a, b) => a + b, 0) / data.kdValues.length * 10) / 10 : null;
        const sortedEntries = data.entries.sort((a, b) => b.volume - a.volume);

        await db.update(pagesTable)
          .set({
            semrushKeywords: data.entries.length,
            semrushTopKeyword: data.topKeyword,
            semrushTopPosition: data.bestPosition < 999 ? data.bestPosition : null,
            semrushVolume: data.totalVolume,
            semrushKd: avgKd,
            semrushKeywordList: JSON.stringify(sortedEntries),
          })
          .where(eq(pagesTable.id, matchedPage.id));

        matched++;
      }
    }

    res.json({
      imported: totalRows,
      skipped: errors.length,
      matched,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("Error uploading SEMrush CSV:", err);
    res.status(400).json({ error: "Invalid input" });
  }
});

// PATCH /pages/batch-status
router.patch("/batch-status", async (req, res) => {
  try {
    const { ids, status } = req.body as { ids: unknown; status: unknown };

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      res.status(400).json({ error: "ids must be a non-empty array with at most 500 items" });
      return;
    }

    const validIds = ids.filter((id): id is number =>
      typeof id === 'number' && Number.isInteger(id) && id > 0
    );
    if (validIds.length !== ids.length) {
      res.status(400).json({ error: "All ids must be positive integers" });
      return;
    }

    const uniqueIds = [...new Set(validIds)];

    const validStatuses = [null, "queued", "in_progress", "refreshed"];
    if (!validStatuses.includes(status as string | null)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const result = await db.update(pagesTable)
      .set({ workflowStatus: status as string | null })
      .where(inArray(pagesTable.id, uniqueIds))
      .returning({ id: pagesTable.id });

    res.json({ updated: result.length, status });
  } catch (err) {
    console.error("Error updating batch status:", err);
    res.status(500).json({ error: "Failed to update status" });
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
