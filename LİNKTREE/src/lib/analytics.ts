export type AnalyticsPeriod = "day" | "week" | "month" | "year";

export type AnalyticsEvent = {
  eventName: string;
  sessionHash: string | null;
  persona: string | null;
  createdAt: Date;
  link?: { slug: string; titleTr: string; titleEn: string } | null;
};

export type AnalyticsSummary = {
  pageViews: number;
  qualifiedViews: number;
  linkClicks: number;
  uniqueVisitors: number;
  primaryDownloads: number;
  startupClicks: number;
  personaCounts: Record<"personal" | "it" | "investor", number>;
  ctr: number | null;
  topLinks: { slug: string; title: string; count: number }[];
  timeline: { label: string; count: number }[];
  totalEvents: number;
};

const periods = new Set<AnalyticsPeriod>(["day", "week", "month", "year"]);
const startupSlugs = new Set(["crunchbase", "f6s", "startuplist"]);

export function parseAnalyticsPeriod(value?: string | string[]): AnalyticsPeriod {
  return typeof value === "string" && periods.has(value as AnalyticsPeriod) ? value as AnalyticsPeriod : "week";
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getPeriodBounds(period: AnalyticsPeriod, now = new Date()) {
  const today = startOfUtcDay(now);
  let start: Date;
  let end: Date;
  let previousStart: Date;

  if (period === "day") {
    start = today;
    end = addUtcDays(start, 1);
    previousStart = addUtcDays(start, -1);
  } else if (period === "week") {
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    start = addUtcDays(today, -mondayOffset);
    end = addUtcDays(start, 7);
    previousStart = addUtcDays(start, -7);
  } else if (period === "month") {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    previousStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  } else {
    start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    end = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
    previousStart = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
  }

  return { start, end, previousStart, previousEnd: start };
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekStart(date: Date) {
  const day = startOfUtcDay(date);
  return addUtcDays(day, -((day.getUTCDay() + 6) % 7));
}

function buildTimeline(events: AnalyticsEvent[], period: AnalyticsPeriod, start: Date, end: Date) {
  const weekly = period === "year";
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.eventName !== "page_view") continue;
    const key = isoDay(weekly ? weekStart(event.createdAt) : event.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: { label: string; count: number }[] = [];
  for (let cursor = weekly ? weekStart(start) : start; cursor < end; cursor = addUtcDays(cursor, weekly ? 7 : 1)) {
    const key = isoDay(cursor);
    points.push({ label: key, count: counts.get(key) ?? 0 });
  }
  return points;
}

export function summarizeAnalytics(
  events: AnalyticsEvent[],
  period: AnalyticsPeriod,
  start: Date,
  end: Date,
  locale: "tr" | "en" = "tr",
): AnalyticsSummary {
  const pageViews = events.filter((event) => event.eventName === "page_view").length;
  const qualifiedViews = events.filter((event) => event.eventName === "qualified_page_view").length;
  const linkEvents = events.filter((event) => event.eventName === "link_click");
  const personaEvents = events.filter((event) => event.eventName === "persona_selected");
  const visitorHashes = new Set(events.map((event) => event.sessionHash).filter((hash): hash is string => Boolean(hash)));
  const linkCounts = new Map<string, { title: string; count: number }>();

  for (const event of linkEvents) {
    if (!event.link) continue;
    const current = linkCounts.get(event.link.slug);
    linkCounts.set(event.link.slug, {
      title: locale === "tr" ? event.link.titleTr : event.link.titleEn,
      count: (current?.count ?? 0) + 1,
    });
  }

  return {
    pageViews,
    qualifiedViews,
    linkClicks: linkEvents.length,
    uniqueVisitors: visitorHashes.size,
    primaryDownloads: linkEvents.filter((event) => event.link?.slug === "download").length,
    startupClicks: linkEvents.filter((event) => event.link && startupSlugs.has(event.link.slug)).length,
    personaCounts: {
      personal: personaEvents.filter((event) => event.persona === "personal").length,
      it: personaEvents.filter((event) => event.persona === "it").length,
      investor: personaEvents.filter((event) => event.persona === "investor").length,
    },
    ctr: pageViews ? linkEvents.length / pageViews : null,
    topLinks: [...linkCounts.entries()]
      .map(([slug, value]) => ({ slug, ...value }))
      .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
      .slice(0, 5),
    timeline: buildTimeline(events, period, start, end),
    totalEvents: events.length,
  };
}

export function percentageChange(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null;
}
