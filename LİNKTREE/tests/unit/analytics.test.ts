import { describe, expect, it } from "vitest";
import {
  getPeriodBounds,
  parseAnalyticsPeriod,
  percentageChange,
  summarizeAnalytics,
  type AnalyticsEvent,
} from "@/lib/analytics";

function event(eventName: string, createdAt: string, extras: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return { eventName, createdAt: new Date(createdAt), sessionHash: null, persona: null, ...extras };
}

describe("analytics periods", () => {
  it("defaults invalid values to week and uses Monday UTC boundaries", () => {
    expect(parseAnalyticsPeriod("invalid")).toBe("week");
    const bounds = getPeriodBounds("week", new Date("2026-09-09T16:00:00Z"));
    expect(bounds.start.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-09-14T00:00:00.000Z");
    expect(bounds.previousStart.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("uses calendar month and year boundaries", () => {
    const month = getPeriodBounds("month", new Date("2026-09-09"));
    const year = getPeriodBounds("year", new Date("2026-09-09"));
    expect(month.start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(month.previousStart.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(year.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(year.previousStart.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("analytics summaries", () => {
  const start = new Date("2026-09-07T00:00:00Z");
  const end = new Date("2026-09-14T00:00:00Z");

  it("calculates real views, visitors, personas, conversions, and linked click groups", () => {
    const download = { slug: "download", titleTr: "İndir", titleEn: "Download" };
    const crunchbase = { slug: "crunchbase", titleTr: "Crunchbase", titleEn: "Crunchbase" };
    const summary = summarizeAnalytics([
      event("page_view", "2026-09-08T10:00:00Z", { sessionHash: "visitor-a" }),
      event("page_view", "2026-09-08T11:00:00Z", { sessionHash: "visitor-a" }),
      event("qualified_page_view", "2026-09-08T11:01:00Z", { sessionHash: "visitor-a" }),
      event("persona_selected", "2026-09-08T11:02:00Z", { sessionHash: "visitor-a", persona: "it" }),
      event("link_click", "2026-09-08T11:03:00Z", { sessionHash: "visitor-a", link: download }),
      event("link_click", "2026-09-09T11:03:00Z", { sessionHash: "visitor-b", link: crunchbase }),
    ], "week", start, end);

    expect(summary.pageViews).toBe(2);
    expect(summary.qualifiedViews).toBe(1);
    expect(summary.uniqueVisitors).toBe(2);
    expect(summary.primaryDownloads).toBe(1);
    expect(summary.startupClicks).toBe(1);
    expect(summary.personaCounts.it).toBe(1);
    expect(summary.ctr).toBe(1);
    expect(summary.topLinks).toHaveLength(2);
    expect(summary.timeline.find((point) => point.label === "2026-09-08")?.count).toBe(2);
  });

  it("shows no CTR without page views and no fabricated percentage from zero", () => {
    const summary = summarizeAnalytics([], "week", start, end);
    expect(summary.ctr).toBeNull();
    expect(percentageChange(5, 0)).toBeNull();
  });
});
