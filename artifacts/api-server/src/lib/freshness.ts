import type { Page } from "@workspace/db";

export type TriageStatus = "critical" | "review" | "healthy";
export type TrafficTrend = "up" | "down" | "stable";

export interface PageFreshnessData {
  id: number;
  url: string;
  title: string | null;
  lastUpdated: Date;
  clicks30d: number;
  clicksPrev30d: number;
  wordCount: number;
  excerpt: string | null;
  freshnessScore: number;
  decayScore: number;
  triageStatus: TriageStatus;
  aiCitationLikely: boolean;
  aiCitationReason: string;
  daysSinceUpdate: number;
  trafficTrend: TrafficTrend;
  createdAt: Date;
  semrushKeywords: number | null;
  semrushTopKeyword: string | null;
  semrushTopPosition: number | null;
  semrushVolume: number | null;
  semrushKd: number | null;
}

export function calculateFreshness(page: Page): PageFreshnessData {
  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - page.lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Traffic trend
  let trafficTrend: TrafficTrend = "stable";
  if (page.clicksPrev30d > 0) {
    const ratio = page.clicks30d / page.clicksPrev30d;
    if (ratio >= 1.1) trafficTrend = "up";
    else if (ratio <= 0.9) trafficTrend = "down";
  } else if (page.clicks30d > 0) {
    trafficTrend = "up";
  }

  // Freshness score (0-100): higher = fresher
  let freshnessScore: number;
  if (daysSinceUpdate <= 30) {
    freshnessScore = 90 + Math.min(10, (30 - daysSinceUpdate) / 3);
  } else if (daysSinceUpdate <= 60) {
    freshnessScore = 70 + ((60 - daysSinceUpdate) / 30) * 20;
  } else if (daysSinceUpdate <= 90) {
    freshnessScore = 50 + ((90 - daysSinceUpdate) / 30) * 20;
  } else if (daysSinceUpdate <= 180) {
    freshnessScore = 25 + ((180 - daysSinceUpdate) / 90) * 25;
  } else if (daysSinceUpdate <= 365) {
    freshnessScore = 10 + ((365 - daysSinceUpdate) / 185) * 15;
  } else {
    freshnessScore = Math.max(0, 10 - (daysSinceUpdate - 365) / 30);
  }

  if (page.clicks30d > 1000) freshnessScore = Math.min(100, freshnessScore + 5);
  if (trafficTrend === "up") freshnessScore = Math.min(100, freshnessScore + 3);

  freshnessScore = Math.round(freshnessScore);

  // Decay score (0-100): higher = more decayed
  let decayScore = 100 - freshnessScore;
  if (daysSinceUpdate > 90 && trafficTrend === "down") {
    decayScore = Math.min(100, decayScore + 15);
  }
  if (daysSinceUpdate > 365) {
    decayScore = Math.min(100, decayScore + 10);
  }
  decayScore = Math.round(decayScore);

  // Triage status
  let triageStatus: TriageStatus;
  if (daysSinceUpdate > 90 && trafficTrend === "down") {
    triageStatus = "critical";
  } else if (daysSinceUpdate > 90 || (daysSinceUpdate > 60 && trafficTrend === "down")) {
    triageStatus = "review";
  } else {
    triageStatus = "healthy";
  }
  if (decayScore >= 75) triageStatus = "critical";
  if (daysSinceUpdate <= 30 && trafficTrend !== "down") triageStatus = "healthy";

  // ── AI Citation prediction ──────────────────────────────────────────────────
  // Use the AI-scored value stored in DB when available (set during sitemap sync).
  // Fall back to a heuristic when not yet scored.
  let aiCitationLikely: boolean;
  let aiCitationReason: string;

  if (page.aiCitationScore !== null && page.aiCitationScore !== undefined) {
    // AI-scored: 65+ = likely (threshold gives ~top third of pages)
    aiCitationLikely = page.aiCitationScore >= 65;
    aiCitationReason = page.aiCitationReason ?? `AI score: ${page.aiCitationScore}/100`;
  } else {
    // Heuristic fallback for pages not yet AI-scored
    const hasSubstantialContent = page.wordCount >= 300;
    const hasShortAnswer =
      page.excerpt != null &&
      page.excerpt.length >= 100 &&
      (page.excerpt.includes("?") ||
        page.excerpt.split(".").length >= 2 ||
        page.wordCount >= 500);
    aiCitationLikely = hasSubstantialContent && (hasShortAnswer || page.wordCount >= 800);
    if (aiCitationLikely) {
      aiCitationReason = "Estimated: has substantial, structured content";
    } else if (!hasSubstantialContent) {
      aiCitationReason = "Estimated: content too short (<300 words)";
    } else {
      aiCitationReason = "Estimated: lacks clear Q&A answer structure";
    }
  }

  return {
    id: page.id,
    url: page.url,
    title: page.title,
    lastUpdated: page.lastUpdated,
    clicks30d: page.clicks30d,
    clicksPrev30d: page.clicksPrev30d,
    wordCount: page.wordCount,
    excerpt: page.excerpt,
    freshnessScore,
    decayScore,
    triageStatus,
    aiCitationLikely,
    aiCitationReason,
    daysSinceUpdate,
    trafficTrend,
    createdAt: page.createdAt,
    semrushKeywords: page.semrushKeywords,
    semrushTopKeyword: page.semrushTopKeyword,
    semrushTopPosition: page.semrushTopPosition,
    semrushVolume: page.semrushVolume,
    semrushKd: page.semrushKd,
  };
}
