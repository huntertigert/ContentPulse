import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getSetting(key: string): Promise<string | null> {
  const row = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, key))
    .limit(1);
  return row[0]?.value ?? null;
}

async function setSetting(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await db.delete(settingsTable).where(eq(settingsTable.key, key));
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getAllSettings() {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.value != null) map[row.key] = row.value;
  }
  return map;
}

// GET /settings
router.get("/", async (_req, res) => {
  try {
    const map = await getAllSettings();
    res.json({
      sitemapUrl: map["sitemapUrl"] ?? null,
      gscSiteUrl: map["gscSiteUrl"] ?? null,
      gscHasCredentials: !!map["gscServiceAccountJson"],
      lastSitemapSync: map["lastSitemapSync"] ? new Date(map["lastSitemapSync"]) : null,
      lastGscSync: map["lastGscSync"] ? new Date(map["lastGscSync"]) : null,
      autoSyncEnabled: map["autoSyncEnabled"] === "true",
    });
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// POST /settings
router.post("/", async (req, res) => {
  try {
    const body = UpdateSettingsBody.parse(req.body);

    if (body.sitemapUrl !== undefined) {
      await setSetting("sitemapUrl", body.sitemapUrl || null);
    }
    if (body.gscSiteUrl !== undefined) {
      await setSetting("gscSiteUrl", body.gscSiteUrl || null);
    }
    if (body.gscServiceAccountJson !== undefined) {
      // Validate it's valid JSON before saving
      try {
        JSON.parse(body.gscServiceAccountJson!);
        await setSetting("gscServiceAccountJson", body.gscServiceAccountJson!);
      } catch {
        res.status(400).json({ error: "gscServiceAccountJson is not valid JSON" });
        return;
      }
    }
    if (body.autoSyncEnabled !== undefined) {
      await setSetting("autoSyncEnabled", body.autoSyncEnabled ? "true" : "false");
    }

    const map = await getAllSettings();
    res.json({
      sitemapUrl: map["sitemapUrl"] ?? null,
      gscSiteUrl: map["gscSiteUrl"] ?? null,
      gscHasCredentials: !!map["gscServiceAccountJson"],
      lastSitemapSync: map["lastSitemapSync"] ? new Date(map["lastSitemapSync"]) : null,
      lastGscSync: map["lastGscSync"] ? new Date(map["lastGscSync"]) : null,
      autoSyncEnabled: map["autoSyncEnabled"] === "true",
    });
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(400).json({ error: "Invalid input" });
  }
});

export { getSetting, setSetting };
export default router;
