import Link from "next/link";
import { db, withDatabase } from "@/lib/db";
import { links, claims } from "@/lib/data";
import { getPeriodBounds, parseAnalyticsPeriod, percentageChange, summarizeAnalytics, type AnalyticsEvent } from "@/lib/analytics";
import { publishAction } from "./actions";

export const dynamic = "force-dynamic";

const periodLabels = { day: "Günlük", week: "Haftalık", month: "Aylık", year: "Yıllık" } as const;

function comparison(current: number, previous: number, hasPrevious: boolean) {
  if (!hasPrevious) return null;
  const change = percentageChange(current, previous);
  return change === null ? `Önceki dönem: ${previous}` : `${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)}%`;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ period?: string | string[] }> }) {
  const period = parseAnalyticsPeriod((await searchParams).period);
  const bounds = getPeriodBounds(period);
  const result = await withDatabase(async () => {
    const [linkCount, claimCount, revisions, mediaCount, currentEvents, previousEvents] = await Promise.all([
      db.link.count({ where: { active: true } }),
      db.claim.count({ where: { status: { in: ["VERIFIED_PUBLIC","QUALIFIED_PUBLIC"] } } }),
      db.publishedRevision.count(),
      db.mediaAsset.count({ where: { usageKey: { not: null } } }),
      db.clickEvent.findMany({
        where: { createdAt: { gte: bounds.start, lt: bounds.end } },
        include: { link: { select: { slug: true, titleTr: true, titleEn: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.clickEvent.findMany({
        where: { createdAt: { gte: bounds.previousStart, lt: bounds.previousEnd } },
        include: { link: { select: { slug: true, titleTr: true, titleEn: true } } },
      }),
    ]);
    return { linkCount, claimCount, revisions, mediaCount, currentEvents, previousEvents, persistent: true };
  }, {
    linkCount: links.length, claimCount: claims.length, revisions: 0, mediaCount: 0,
    currentEvents: [] as AnalyticsEvent[], previousEvents: [] as AnalyticsEvent[], persistent: false,
  });
  const current = summarizeAnalytics(result.currentEvents, period, bounds.start, bounds.end);
  const previous = summarizeAnalytics(result.previousEvents, period, bounds.previousStart, bounds.previousEnd);
  const hasPrevious = previous.totalEvents > 0;
  const personaTotal = Object.values(current.personaCounts).reduce((sum, count) => sum + count, 0);
  const maxTimeline = Math.max(...current.timeline.map((point) => point.count), 1);
  const metrics = [
    ["Sayfa görüntüleme", current.pageViews, previous.pageViews],
    ["Nitelikli görüntüleme", current.qualifiedViews, previous.qualifiedViews],
    ["Dış bağlantı tıklaması", current.linkClicks, previous.linkClicks],
    ["Tekil ziyaretçi (tahmini)", current.uniqueVisitors, previous.uniqueVisitors],
    ["Ana indirme tıklaması", current.primaryDownloads, previous.primaryDownloads],
    ["Startup profil tıklaması", current.startupClicks, previous.startupClicks],
  ] as const;

  return <>
    <p className="section-kicker">Control center</p><h1>Signal Hub overview</h1>
    {!result.persistent ? <p className="admin-note">Read-only fallback is active. Configure DATABASE_URL, run migrations and seed before editing or publishing.</p> : null}
    <div className="admin-grid">
      <article className="admin-stat"><strong>{result.linkCount}</strong><span>Active links</span></article>
      <article className="admin-stat"><strong>{result.claimCount}</strong><span>Public claims</span></article>
      <article className="admin-stat"><strong>{current.totalEvents || "—"}</strong><span>Period events</span></article>
    </div>
    <section id="analytics" aria-labelledby="analytics-title">
      <p className="section-kicker" style={{ marginTop: 34 }}>First-party analytics · UTC</p>
      <h2 id="analytics-title">Gerçek etkinlik analitiği</h2>
      <nav className="admin-periods" aria-label="Analiz dönemi">
        {(Object.keys(periodLabels) as (keyof typeof periodLabels)[]).map((key) => <Link key={key} href={`/admin?period=${key}#analytics`} className={period === key ? "active" : ""} aria-current={period === key ? "page" : undefined}>{periodLabels[key]}</Link>)}
      </nav>
      <p className="admin-note">{bounds.start.toISOString().slice(0, 10)} – {new Date(bounds.end.getTime() - 1).toISOString().slice(0, 10)} · Önceki dönem karşılaştırması yalnızca kayıt varsa gösterilir.</p>
      <div className="admin-metrics">
        {metrics.map(([label, value, previousValue]) => <article className="admin-metric" key={label}><strong>{value}</strong><span>{label}</span><small>{comparison(value, previousValue, hasPrevious) ?? " "}</small></article>)}
        <article className="admin-metric"><strong>{current.ctr === null ? "—" : `${(current.ctr * 100).toFixed(1)}%`}</strong><span>Dış bağlantı CTR</span><small>link_click / page_view</small></article>
      </div>
      <div className="analytics-layout">
        <section className="admin-panel">
          <h2>{period === "year" ? "Haftalık" : "Günlük"} sayfa görüntülemeleri</h2>
          {current.pageViews ? <div className="analytics-bars" role="img" aria-label={`${current.pageViews} sayfa görüntülemesinin zaman çizelgesi`}>
            {current.timeline.map((point) => <div className="analytics-bar" key={point.label} title={`${point.label}: ${point.count}`}><i style={{ height: `${Math.max((point.count / maxTimeline) * 100, point.count ? 4 : 1)}%` }}/><span>{point.label}: {point.count}</span></div>)}
          </div> : <p className="empty-state">Bu dönemde zaman çizelgesi oluşturacak sayfa görüntülemesi yok.</p>}
        </section>
        <section className="admin-panel">
          <h2>Persona seçimleri</h2>
          {personaTotal ? <div className="persona-distribution">
            {Object.entries(current.personaCounts).map(([name, count]) => <div key={name}><span>{name}</span><i style={{ width: `${(count / personaTotal) * 100}%` }}/><strong>{count}</strong></div>)}
          </div> : <p className="empty-state">Bu dönemde persona seçimi yok.</p>}
        </section>
      </div>
      <section className="admin-panel"><h2>En çok tıklanan bağlantılar</h2>
        {current.topLinks.length ? current.topLinks.map((item) => <div className="data-row" key={item.slug}><span>{item.title}<small>/{item.slug}</small></span><strong>{item.count}</strong></div>) : <p className="empty-state">Bu dönemde bağlantı tıklaması yok.</p>}
      </section>
    </section>
    <section className="admin-panel"><h2>Publishing</h2><p>{result.revisions ? `${result.revisions} immutable revision(s) stored.` : "No published database revision yet."}</p><form action={publishAction}><button className="button primary" disabled={!result.persistent}>Publish current content</button></form></section>
    <section className="admin-panel"><h2>Production checklist</h2><div className="data-row"><span>Database persistence</span><strong>{result.persistent ? "Ready" : "Required"}</strong></div><div className="data-row"><span>First-party analytics</span><strong>{result.persistent ? "Collecting" : "Paused"}</strong></div><div className="data-row"><span>Assigned brand/product media</span><strong>{result.mediaCount || "—"}</strong></div></section>
  </>;
}
