import { Router, type IRouter } from "express";
import { db, pagesTable, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { google } from "googleapis";
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

  // Check if it's a sitemap index
  const sitemapLocs = extractTags(xml, "sitemap").map((s) => extractTag(s, "loc")).filter(Boolean) as string[];
  if (sitemapLocs.length > 0) {
    // Sitemap index — recurse
    for (const loc of sitemapLocs.slice(0, 20)) {
      const sub = await parseSitemap(loc, depth + 1);
      entries.push(...sub);
    }
    return entries;
  }

  // Regular sitemap
  const urlBlocks = extractTags(xml, "url");
  for (const block of urlBlocks) {
    const loc = extractTag(block, "loc");
    const lastmod = extractTag(block, "lastmod");
    if (loc) {
      entries.push({ url: loc, lastmod });
    }
  }

  return entries;
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

    // Build valid rows first so we only wipe existing data if the sitemap parsed cleanly
    const rows: Array<{ url: string; lastUpdated: Date }> = [];
    for (const entry of entries) {
      const lastUpdated = entry.lastmod ? new Date(entry.lastmod) : new Date();
      if (isNaN(lastUpdated.getTime())) {
        errors.push(`Skipped ${entry.url}: invalid date "${entry.lastmod}"`);
        continue;
      }
      rows.push({ url: entry.url, lastUpdated });
    }

    // Replace all existing pages with the sitemap data so example/seed rows are cleared
    await db.delete(pagesTable);

    for (const row of rows) {
      try {
        await db.insert(pagesTable).values({
          url: row.url,
          lastUpdated: row.lastUpdated,
          clicks30d: 0,
          clicksPrev30d: 0,
          wordCount: 0,
        });
        upserted++;
      } catch (rowErr) {
        errors.push(`Error inserting ${row.url}: ${String(rowErr)}`);
      }
    }

    await setSetting("lastSitemapSync", new Date().toISOString());

    res.json({
      success: true,
      message: `Sitemap sync complete — ${upserted} pages imported from your sitemap.`,
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

    // Fetch last 30 days
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

        // Normalize URL — strip the site URL prefix to get path
        let urlPath = pageUrl;
        try {
          const parsed = new URL(pageUrl);
          urlPath = parsed.pathname + (parsed.search || "");
        } catch {}

        // Try to find by full URL or path
        const existingFull = await db
          .select()
          .from(pagesTable)
          .where(eq(pagesTable.url, pageUrl))
          .limit(1);
        const existingPath = existingFull.length === 0
          ? await db.select().from(pagesTable).where(eq(pagesTable.url, urlPath)).limit(1)
          : existingFull;

        if (existingPath.length > 0) {
          await db
            .update(pagesTable)
            .set({ clicks30d, clicksPrev30d })
            .where(eq(pagesTable.id, existingPath[0].id));
          updated++;
        } else {
          // Insert new page discovered from GSC
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
      friendly = "Permission denied (403). You need to add your service account email as a user in Google Search Console → Settings → Users and permissions → Add user → Full. Then try again.";
    } else if (msg.includes("invalid_grant") || msg.includes("unauthorized") || code === 401) {
      friendly = "Authentication failed. Make sure the service account JSON key is correct and the Search Console API is enabled in your Google Cloud project.";
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

export default router;
