import { Router, type IRouter } from "express";
import { db, pagesTable } from "@workspace/db";
import { eq, gte } from "drizzle-orm";
import { google } from "googleapis";
import { openai } from "@workspace/integrations-openai-ai-server";
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { getAllSettings, getSetting, setSetting } from "./settings.js";

const router: IRouter = Router();

// ─── Sitemap helpers ─────────────────────────────────────────────────────────

interface SitemapEntry {
  url: string;
  lastmod: string | null;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ContentFreshnessDashboard/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function extractTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

function extractTag(xml: string, tag: string): string | null {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml);
  return m ? stripCdata(m[1].trim()) : null;
}

async function parseSitemap(url: string, depth = 0): Promise<SitemapEntry[]> {
  if (depth > 3) return [];
  const xml = await fetchText(url);
  const entries: SitemapEntry[] = [];

  const sitemapLocs = extractTags(xml, "sitemap")
    .map((s) => extractTag(s, "loc"))
    .filter(Boolean) as string[];
  if (sitemapLocs.length > 0) {
    for (const loc of sitemapLocs.slice(0, 20)) {
      const sub = await parseSitemap(loc, depth + 1);
      entries.push(...sub);
    }
    return entries;
  }

  const urlBlocks = extractTags(xml, "url");
  for (const block of urlBlocks) {
    const loc = extractTag(block, "loc");
    const lastmod = extractTag(block, "lastmod");
    if (loc) entries.push({ url: loc, lastmod });
  }
  return entries;
}

// ─── HTML scraping helpers ────────────────────────────────────────────────────

interface PageMeta {
  title: string | null;
  excerpt: string | null;
  wordCount: number;
}

async function scrapePageMeta(url: string): Promise<PageMeta> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ContentFreshnessDashboard/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { title: null, excerpt: null, wordCount: 0 };
    const html = await res.text();

    // Extract <title>
    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    let title = titleMatch ? titleMatch[1].trim() : null;
    // Strip site suffix like " | Company Name"
    if (title) title = title.split(/\s*[|\-–—]\s*/)[0].trim() || title;

    // Strip scripts, styles, nav, header, footer, aside to get main body text
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    // Take first ~400 chars of body as excerpt
    const excerpt = bodyText.length > 50 ? bodyText.slice(0, 400) : null;

    return { title, excerpt, wordCount };
  } catch {
    return { title: null, excerpt: null, wordCount: 0 };
  }
}

// ─── AI Citation scoring ──────────────────────────────────────────────────────

interface CitationResult {
  score: number;
  reason: string;
}

async function scoreAiCitation(
  url: string,
  title: string | null,
  wordCount: number,
  excerpt: string | null,
): Promise<CitationResult> {
  const prompt = `You are an SEO expert. Analyze whether AI assistants (ChatGPT, Claude, Gemini) would likely cite this page.

URL: ${url}
Title: ${title || "(unknown)"}
Word count: ${wordCount}
Excerpt: ${excerpt ? excerpt.slice(0, 250) : "(not available)"}

Score 0-100:
80-100 = Highly likely (authoritative, factual, comprehensive, how-to, definition, statistics)
50-79 = Moderately likely (useful but lacks depth or answer structure)
0-49 = Unlikely (thin, promotional, or no factual value)

Respond ONLY with this exact format, nothing else:
SCORE: <number>
REASON: <one sentence>`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 100,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";

  // Parse SCORE/REASON format
  const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
  const reasonMatch = raw.match(/REASON:\s*(.+)/i);
  if (scoreMatch) {
    return {
      score: Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))),
      reason: (reasonMatch?.[1] || "").trim().slice(0, 200),
    };
  }

  // Fallback: try JSON
  try {
    const jsonMatch = raw.match(/\{[\s\S]*?"score"\s*:\s*(\d+)[\s\S]*?"reason"\s*:\s*"([^"]*)"[\s\S]*?\}/);
    if (jsonMatch) {
      return {
        score: Math.min(100, Math.max(0, parseInt(jsonMatch[1], 10))),
        reason: jsonMatch[2].slice(0, 200),
      };
    }
    const parsed = JSON.parse(raw);
    return {
      score: Math.min(100, Math.max(0, Math.round(Number(parsed.score)))),
      reason: String(parsed.reason || "").slice(0, 200),
    };
  } catch {}

  // Last resort: try to find any number
  const anyNum = raw.match(/(\d{1,3})/);
  if (anyNum) {
    return { score: Math.min(100, parseInt(anyNum[1], 10)), reason: raw.slice(0, 200) };
  }

  console.warn("AI citation parse fail for", url, ":", raw.slice(0, 100));
  return { score: 50, reason: "Could not parse AI response" };
}

// ─── GSC helpers ─────────────────────────────────────────────────────────────

async function getGscClient(serviceAccountJson: string) {
  const key = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.searchconsole({ version: "v1", auth });
}

async function fetchGscClicksByPage(
  serviceAccountJson: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  const sc = await getGscClient(serviceAccountJson);
  const result = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 5000,
    },
  });
  const clickMap: Record<string, number> = {};
  for (const row of result.data.rows ?? []) {
    const page = row.keys?.[0];
    if (page) clickMap[page] = row.clicks ?? 0;
  }
  return clickMap;
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /sync/status
router.get("/status", async (_req, res) => {
  try {
    const map = await getAllSettings();
    res.json({
      lastSitemapSync: map["lastSitemapSync"] ? new Date(map["lastSitemapSync"]) : null,
      lastGscSync: map["lastGscSync"] ? new Date(map["lastGscSync"]) : null,
      sitemapConfigured: !!map["sitemapUrl"],
      gscConfigured: !!map["gscServiceAccountJson"] && !!map["gscSiteUrl"],
    });
  } catch (err) {
    console.error("Error fetching sync status:", err);
    res.status(500).json({ error: "Failed to fetch sync status" });
  }
});

// POST /sync/sitemap
router.post("/sitemap", async (_req, res) => {
  const errors: string[] = [];
  let upserted = 0;

  try {
    const sitemapUrl = await getSetting("sitemapUrl");
    if (!sitemapUrl) {
      res.status(400).json({
        success: false,
        message: "No sitemap URL configured. Go to Settings to add your sitemap URL.",
        upserted: 0,
        updated: 0,
        errors: [],
      });
      return;
    }

    const entries = await parseSitemap(sitemapUrl);
    if (entries.length === 0) {
      res.json({
        success: false,
        message: "No URLs found in sitemap. Check that the URL is a valid XML sitemap.",
        upserted: 0,
        updated: 0,
        errors: ["No URLs found in sitemap"],
      });
      return;
    }

    // Build valid rows
    const rows: Array<{ url: string; lastUpdated: Date }> = [];
    for (const entry of entries) {
      const lastUpdated = entry.lastmod ? new Date(entry.lastmod) : new Date();
      if (isNaN(lastUpdated.getTime())) {
        errors.push(`Skipped ${entry.url}: invalid date "${entry.lastmod}"`);
        continue;
      }
      rows.push({ url: entry.url, lastUpdated });
    }

    // Step 1: Scrape HTML metadata (title, excerpt, word count) in parallel batches
    console.log(`Scraping metadata for ${rows.length} pages...`);
    const metaResults = await batchProcess(
      rows,
      (row) => scrapePageMeta(row.url),
      { concurrency: 8, retries: 1 },
    );

    // Step 2: Score AI citation likelihood in parallel batches
    console.log(`Scoring AI citation for ${rows.length} pages...`);
    const citationResults = await batchProcess(
      rows.map((row, i) => ({ row, meta: metaResults[i]! })),
      ({ row, meta }) =>
        scoreAiCitation(row.url, meta.title, meta.wordCount, meta.excerpt),
      { concurrency: 5, retries: 3 },
    );

    // Step 3: Replace all existing pages
    await db.delete(pagesTable);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const meta = metaResults[i] ?? { title: null, excerpt: null, wordCount: 0 };
      const citation = citationResults[i] ?? { score: 50, reason: "" };
      try {
        await db.insert(pagesTable).values({
          url: row.url,
          title: meta.title,
          lastUpdated: row.lastUpdated,
          clicks30d: 0,
          clicksPrev30d: 0,
          wordCount: meta.wordCount,
          excerpt: meta.excerpt,
          aiCitationScore: citation.score,
          aiCitationReason: citation.reason,
        });
        upserted++;
      } catch (rowErr) {
        errors.push(`Error inserting ${row.url}: ${String(rowErr)}`);
      }
    }

    await setSetting("lastSitemapSync", new Date().toISOString());

    res.json({
      success: true,
      message: `Sync complete — ${upserted} pages imported with titles and AI citation scores.`,
      upserted,
      updated: 0,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("Sitemap sync error:", err);
    res.status(500).json({
      success: false,
      message: `Sitemap sync failed: ${String(err)}`,
      upserted,
      updated: 0,
      errors: [String(err)],
    });
  }
});

// POST /sync/gsc
router.post("/gsc", async (_req, res) => {
  const errors: string[] = [];
  let updated = 0;

  try {
    const serviceAccountJson = await getSetting("gscServiceAccountJson");
    const siteUrl = await getSetting("gscSiteUrl");

    if (!serviceAccountJson || !siteUrl) {
      res.status(400).json({
        success: false,
        message: "Google Search Console is not configured. Go to Settings to add your credentials.",
        upserted: 0,
        updated: 0,
        errors: [],
      });
      return;
    }

    const end = dateStr(0);
    const start30 = dateStr(30);
    const start60 = dateStr(60);

    const [current30, prev30] = await Promise.all([
      fetchGscClicksByPage(serviceAccountJson, siteUrl, start30, end),
      fetchGscClicksByPage(serviceAccountJson, siteUrl, start60, start30),
    ]);

    const allPages = new Set([...Object.keys(current30), ...Object.keys(prev30)]);

    for (const pageUrl of allPages) {
      try {
        const clicks30d = current30[pageUrl] ?? 0;
        const clicksPrev30d = prev30[pageUrl] ?? 0;

        let urlPath = pageUrl;
        try {
          const parsed = new URL(pageUrl);
          urlPath = parsed.pathname + (parsed.search || "");
        } catch {}

        const existingFull = await db
          .select()
          .from(pagesTable)
          .where(eq(pagesTable.url, pageUrl))
          .limit(1);
        const existingPath =
          existingFull.length === 0
            ? await db
                .select()
                .from(pagesTable)
                .where(eq(pagesTable.url, urlPath))
                .limit(1)
            : existingFull;

        if (existingPath.length > 0) {
          await db
            .update(pagesTable)
            .set({ clicks30d, clicksPrev30d })
            .where(eq(pagesTable.id, existingPath[0].id));
          updated++;
        } else {
          await db.insert(pagesTable).values({
            url: urlPath,
            lastUpdated: new Date(),
            clicks30d,
            clicksPrev30d,
            wordCount: 0,
          });
          updated++;
        }
      } catch (rowErr) {
        errors.push(`Error for ${pageUrl}: ${String(rowErr)}`);
      }
    }

    await setSetting("lastGscSync", new Date().toISOString());

    res.json({
      success: true,
      message: `GSC sync complete. Updated traffic data for ${updated} pages.`,
      upserted: 0,
      updated,
      errors: errors.slice(0, 10),
    });
  } catch (err: any) {
    console.error("GSC sync error:", err);
    const msg = err?.message || String(err);
    const code = err?.code || err?.status;
    let friendly: string;
    if (msg.includes("sufficient permission") || code === 403) {
      friendly =
        "Permission denied (403). You need to add your service account email as a user in Google Search Console → Settings → Users and permissions → Add user → Full. Then try again.";
    } else if (msg.includes("invalid_grant") || msg.includes("unauthorized") || code === 401) {
      friendly =
        "Authentication failed. Make sure the service account JSON key is correct and the Search Console API is enabled in your Google Cloud project.";
    } else {
      friendly = `GSC sync failed: ${msg}`;
    }
    res.status(500).json({
      success: false,
      message: friendly,
      upserted: 0,
      updated,
      errors: [friendly],
    });
  }
});

// POST /sync/rescore-ai — re-score AI citation, optionally filtered by timeline
router.post("/rescore-ai", async (req, res) => {
  let updated = 0;
  const errors: string[] = [];

  try {
    const maxAgeDays: Record<string, number> = {
      "1m": 30, "3m": 90, "6m": 180, "1y": 365, "1.5y": 548, "2y": 730,
    };
    const filter = req.body?.dateFilter as string | undefined;
    const days = filter && maxAgeDays[filter];

    let query = db.select().from(pagesTable);
    if (days) {
      const cutoff = new Date(Date.now() - days * 86400000);
      query = query.where(gte(pagesTable.lastUpdated, cutoff)) as any;
    }
    const allPages = await query.orderBy(pagesTable.id);

    if (allPages.length === 0) {
      res.json({ success: true, message: "No pages matched the filter.", upserted: 0, updated: 0, errors: [] });
      return;
    }

    const label = days ? `${filter} (${allPages.length} pages)` : `all (${allPages.length} pages)`;
    console.log(`Re-scoring AI citations for ${label}...`);

    const results = await batchProcess(
      allPages,
      async (page) => {
        const result = await scoreAiCitation(
          page.url,
          page.title,
          page.wordCount,
          page.excerpt,
        );
        await db
          .update(pagesTable)
          .set({ aiCitationScore: result.score, aiCitationReason: result.reason })
          .where(eq(pagesTable.id, page.id));
        return result;
      },
      { concurrency: 3, retries: 3 },
    );

    updated = results.filter(Boolean).length;

    res.json({
      success: true,
      message: `AI citation analysis complete — scored ${updated} pages.`,
      upserted: 0,
      updated,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("AI rescore error:", err);
    res.status(500).json({
      success: false,
      message: `AI rescore failed: ${String(err)}`,
      upserted: 0,
      updated,
      errors: [String(err)],
    });
  }
});

export default router;
