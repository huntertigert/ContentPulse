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
  semrushKeywordList: { keyword: string; position: number; volume: number; kd: number }[] | null;
  priorityScore: number;
  refreshRecommendations: string[];
  workflowStatus: string | null;
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

  const semrushKeywordList = page.semrushKeywordList ? JSON.parse(page.semrushKeywordList) : null;

  const priorityScore = calculatePriorityScore({
    decayScore,
    clicks30d: page.clicks30d,
    clicksPrev30d: page.clicksPrev30d,
    trafficTrend,
    wordCount: page.wordCount,
    daysSinceUpdate,
    aiCitationLikely,
    semrushVolume: page.semrushVolume,
    semrushTopPosition: page.semrushTopPosition,
    semrushKd: page.semrushKd,
  });

  const refreshRecommendations = generateRecommendations({
    daysSinceUpdate,
    trafficTrend,
    clicks30d: page.clicks30d,
    clicksPrev30d: page.clicksPrev30d,
    wordCount: page.wordCount,
    decayScore,
    aiCitationLikely,
    semrushVolume: page.semrushVolume,
    semrushTopPosition: page.semrushTopPosition,
    semrushKeywordList,
    semrushKd: page.semrushKd,
  });

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
    semrushKeywordList,
    priorityScore,
    refreshRecommendations,
    workflowStatus: page.workflowStatus,
  };
}

interface PriorityInputs {
  decayScore: number;
  clicks30d: number;
  clicksPrev30d: number;
  trafficTrend: TrafficTrend;
  wordCount: number;
  daysSinceUpdate: number;
  aiCitationLikely: boolean;
  semrushVolume: number | null;
  semrushTopPosition: number | null;
  semrushKd: number | null;
}

function calculatePriorityScore(input: PriorityInputs): number {
  let score = 0;

  const decayComponent = input.decayScore * 0.35;
  score += decayComponent;

  let trafficComponent = 0;
  const maxTraffic = 500;
  const trafficNorm = Math.min(input.clicks30d / maxTraffic, 1);
  trafficComponent = trafficNorm * 15;
  if (input.trafficTrend === "down") {
    const dropPct = input.clicksPrev30d > 0
      ? (input.clicksPrev30d - input.clicks30d) / input.clicksPrev30d
      : 0;
    trafficComponent += Math.min(dropPct * 20, 10);
  }
  score += trafficComponent;

  let keywordComponent = 0;
  if (input.semrushVolume != null && input.semrushVolume > 0) {
    const volNorm = Math.min(input.semrushVolume / 50000, 1);
    keywordComponent += volNorm * 10;
  }
  if (input.semrushTopPosition != null) {
    if (input.semrushTopPosition <= 10) {
      keywordComponent += 10;
    } else if (input.semrushTopPosition <= 20) {
      keywordComponent += 6;
    } else {
      keywordComponent += 2;
    }
  }
  if (input.semrushKd != null && input.semrushKd > 50) {
    keywordComponent += Math.min((input.semrushKd - 50) / 50, 1) * 5;
  }
  score += keywordComponent;

  if (input.aiCitationLikely && input.decayScore > 50) {
    score += 8;
  } else if (input.aiCitationLikely) {
    score += 4;
  }

  if (input.wordCount < 500 && input.daysSinceUpdate > 90) {
    score += 6;
  } else if (input.wordCount < 1000 && input.daysSinceUpdate > 180) {
    score += 3;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

interface RecommendationInputs {
  daysSinceUpdate: number;
  trafficTrend: TrafficTrend;
  clicks30d: number;
  clicksPrev30d: number;
  wordCount: number;
  decayScore: number;
  aiCitationLikely: boolean;
  semrushVolume: number | null;
  semrushTopPosition: number | null;
  semrushKeywordList: { keyword: string; position: number; volume: number; kd: number }[] | null;
  semrushKd: number | null;
}

function generateRecommendations(input: RecommendationInputs): string[] {
  const recs: string[] = [];

  if (input.daysSinceUpdate > 365) {
    const months = Math.floor(input.daysSinceUpdate / 30);
    recs.push(`Content is ${months} months old — do a full rewrite with current ${new Date().getFullYear()} data and examples`);
  } else if (input.daysSinceUpdate > 180) {
    recs.push(`Update statistics, screenshots, and references to reflect current information`);
  } else if (input.daysSinceUpdate > 90) {
    recs.push(`Add a recent update section with latest developments or data points`);
  }

  if (input.trafficTrend === "down" && input.clicksPrev30d > 0) {
    const dropPct = Math.round(((input.clicksPrev30d - input.clicks30d) / input.clicksPrev30d) * 100);
    if (dropPct > 30) {
      recs.push(`Traffic dropped ${dropPct}% — investigate SERP changes, check for new competitor content`);
    } else if (dropPct > 10) {
      recs.push(`Traffic declining ${dropPct}% — add new sections or update existing ones to regain ranking`);
    }
  }

  if (input.wordCount < 500) {
    recs.push(`Thin content (${input.wordCount} words) — expand to 1,500+ words with detailed coverage`);
  } else if (input.wordCount < 1000 && input.semrushKd != null && input.semrushKd > 40) {
    recs.push(`Content is short for competitive keywords (KD ${input.semrushKd}) — expand depth to 2,000+ words`);
  }

  if (input.aiCitationLikely && input.decayScore > 50) {
    recs.push(`High AI citation potential at risk — add structured FAQ section and update key facts`);
  } else if (!input.aiCitationLikely && input.wordCount >= 500) {
    recs.push(`Improve AI citation potential: add clear definitions, concise answers, and FAQ schema`);
  }

  if (input.semrushVolume != null && input.semrushVolume > 10000 && input.decayScore > 60) {
    recs.unshift(`High-value page (${input.semrushVolume.toLocaleString()} monthly volume) decaying — prioritize this refresh`);
  }

  if (input.semrushKeywordList && input.semrushKeywordList.length > 0) {
    const strikingDistance = input.semrushKeywordList.filter(
      kw => kw.position >= 4 && kw.position <= 15 && kw.volume >= 500
    );
    if (strikingDistance.length > 0) {
      const top = strikingDistance.sort((a, b) => b.volume - a.volume)[0];
      recs.push(`"${top.keyword}" ranks #${top.position} (${top.volume.toLocaleString()} vol) — optimize heading, intro, and internal links for this term`);
    }

    const page1 = input.semrushKeywordList.filter(kw => kw.position <= 3 && kw.volume >= 200);
    if (page1.length > 0) {
      recs.push(`Protect ${page1.length} top-3 ranking${page1.length > 1 ? "s" : ""} — keep content fresh and add supporting internal links`);
    }
  }

  if (recs.length === 0) {
    if (input.decayScore < 30) {
      recs.push(`Content is fresh — schedule a proactive review in ${Math.max(1, 3 - Math.floor(input.daysSinceUpdate / 30))} months`);
    } else {
      recs.push(`Review content for accuracy and add any recent developments`);
    }
  }

  return recs.slice(0, 5);
}
