import { db, withDatabase } from "@/lib/db";
import { claims, faqs, links, type Locale } from "@/lib/data";

export async function getPublicData() {
  const now = new Date();
  return withDatabase(async () => {
    const media = await db.mediaAsset.findMany({ where: { usageKey: { not: null } } });
    const revision = await db.publishedRevision.findFirst({ orderBy: { versionNumber: "desc" } });
    if (revision) {
      const snapshot = revision.snapshotJson as Record<string, unknown[]>;
      const publicLinks = (snapshot.links ?? []).filter((item) => {
        const link = item as Record<string, unknown>;
        return link.active && (!link.publishFrom || new Date(String(link.publishFrom)) <= now) && (!link.publishUntil || new Date(String(link.publishUntil)) >= now);
      });
      const publicClaims = (snapshot.claims ?? []).filter((item) => {
        const claim = item as Record<string, unknown>;
        return ["VERIFIED_PUBLIC","QUALIFIED_PUBLIC"].includes(String(claim.status)) && (!claim.expiresAt || new Date(String(claim.expiresAt)) >= now);
      });
      const publicFaqs = (snapshot.faqs ?? []).filter((item) => (item as Record<string, unknown>).enabled);
      return { links: publicLinks, claims: publicClaims, faqs: publicFaqs, content: snapshot.content ?? [], media };
    }
    const [dbLinks, dbClaims, dbFaqs, content] = await Promise.all([
      db.link.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.claim.findMany({ where: { status: { in: ["VERIFIED_PUBLIC", "QUALIFIED_PUBLIC"] } }, orderBy: { sortOrder: "asc" } }),
      db.faq.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }), db.contentEntry.findMany(),
    ]);
    return { links: dbLinks, claims: dbClaims, faqs: dbFaqs, content, media };
  }, {
    links, claims, faqs, content: [],
    media: [
      { id: "profile-default", usageKey: "profile_logo", storageKey: "/brand/heimerclean-character.png", altTr: "HeimerClean", altEn: "HeimerClean" },
      { id: "wordmark-default", usageKey: "wordmark", storageKey: "/brand/heimerclean-wordmark-light.png", altTr: "HeimerClean", altEn: "HeimerClean" },
      { id: "dashboard-default", usageKey: "product_dashboard", storageKey: "/product/dashboard.png", altTr: "HeimerClean kontrol paneli", altEn: "HeimerClean dashboard" },
      { id: "report-default", usageKey: "product_report", storageKey: "/product/report.png", altTr: "HeimerClean rapor ekranı", altEn: "HeimerClean report screen" },
      { id: "performance-default", usageKey: "product_performance", storageKey: "/product/performance.png", altTr: "HeimerClean performans ekranı", altEn: "HeimerClean performance screen" },
    ],
  });
}

export function localized<T extends Record<string, unknown>>(record: T, field: string, locale: Locale): string {
  const key = `${field}${locale === "tr" ? "Tr" : "En"}`;
  return String(record[key] ?? record[`${field}Tr`] ?? "");
}

export function safeDestination(value: string): URL | null {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

export function mergeUtm(destination: string, utm: Record<string, string>) {
  const url = safeDestination(destination);
  if (!url) throw new Error("Unsafe destination");
  for (const [key, value] of Object.entries(utm)) {
    if (/^utm_(source|medium|campaign|term|content)$/.test(key) && value) url.searchParams.set(key, value);
  }
  return url.toString();
}
