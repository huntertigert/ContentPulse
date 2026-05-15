import { db, pagesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getSetting, setSetting } from "./routes/settings.js";
import { runSitemapSync } from "./routes/sync.js";

const DEFAULT_SITEMAP_URL = "https://www.alkami.com/sitemap.xml";

let bootstrapPromise: Promise<void> | null = null;

export function bootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      const existing = await getSetting("sitemapUrl");
      if (!existing) {
        console.log(`[bootstrap] Seeding default sitemap URL: ${DEFAULT_SITEMAP_URL}`);
        await setSetting("sitemapUrl", DEFAULT_SITEMAP_URL);
      }

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
