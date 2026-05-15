import { db, pagesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getSetting, setSetting } from "./routes/settings.js";
import { runSitemapSync } from "./routes/sync.js";

const DEFAULT_SITEMAP_URL =
  process.env["DEFAULT_SITEMAP_URL"] ?? "https://www.alkami.com/post-sitemap.xml";
const DEFAULT_GSC_SITE_URL =
  process.env["DEFAULT_GSC_SITE_URL"] ?? "https://www.alkami.com";
const DEFAULT_GSC_SERVICE_ACCOUNT_JSON =
  process.env["DEFAULT_GSC_SERVICE_ACCOUNT_JSON"] ?? null;

let bootstrapPromise: Promise<void> | null = null;

async function seedIfMissing(key: string, value: string | null, label: string) {
  if (!value) return;
  const existing = await getSetting(key);
  if (existing) return;
  console.log(`[bootstrap] Seeding default ${label}`);
  await setSetting(key, value);
}

export function bootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      await seedIfMissing("sitemapUrl", DEFAULT_SITEMAP_URL, `sitemap URL (${DEFAULT_SITEMAP_URL})`);
      await seedIfMissing("gscSiteUrl", DEFAULT_GSC_SITE_URL, `GSC site URL (${DEFAULT_GSC_SITE_URL})`);
      await seedIfMissing(
        "gscServiceAccountJson",
        DEFAULT_GSC_SERVICE_ACCOUNT_JSON,
        "GSC service-account credentials (from env)",
      );

      const countRes = await db.select({ c: sql<number>`count(*)::int` }).from(pagesTable);
      const pageCount = countRes[0]?.c ?? 0;

      if (pageCount === 0) {
        console.log("[bootstrap] No pages found — running initial sitemap sync in the background...");
        runSitemapSync()
          .then((r) => console.log(`[bootstrap] Initial sync done: ${r.message}`))
          .catch((e) => console.error("[bootstrap] Initial sync failed:", e));
      } else {
        console.log(`[bootstrap] ${pageCount} pages already in DB — skipping initial sync.`);
      }
    } catch (err) {
      console.error("[bootstrap] Error during startup bootstrap:", err);
    }
  })();
  return bootstrapPromise;
}
