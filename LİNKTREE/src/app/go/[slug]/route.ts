import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, withDatabase } from "@/lib/db";
import { links } from "@/lib/data";
import { mergeUtm, safeDestination } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  const fallback = links.find((item) => item.slug === slug && item.active) ?? null;
  const link = await withDatabase(async () => {
    const direct = await db.link.findFirst({ where: { slug, active: true, AND: [{ OR: [{ publishFrom: null }, { publishFrom: { lte: now } }] }, { OR: [{ publishUntil: null }, { publishUntil: { gte: now } }] }] } });
    if (direct) return direct;
    const alias = await db.redirectAlias.findUnique({ where: { oldSlug: slug }, include: { link: true } });
    return alias?.link.active ? alias.link : null;
  }, fallback);
  if (!link || !safeDestination(link.destinationUrl)) {
    return NextResponse.redirect(new URL("/en?missing=link", request.url), 307);
  }
  const utm = typeof link.utmJson === "object" && link.utmJson ? link.utmJson as Record<string, string> : {};
  const destination = mergeUtm(link.destinationUrl, utm);
  if (process.env.DATABASE_URL && request.headers.get("dnt") !== "1" && request.headers.get("sec-gpc") !== "1") {
    const referer = request.headers.get("referer");
    let source: URL | null = null;
    try { source = referer ? new URL(referer) : null; } catch { source = null; }
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const day = new Date().toISOString().slice(0, 10);
    const salt = process.env.ANALYTICS_DAILY_SALT_SECRET;
    const sessionHash = salt && salt.length >= 24
      ? createHash("sha256").update(`${forwarded}|${request.headers.get("user-agent") ?? ""}|${day}|${salt}`).digest("hex")
      : null;
    const locale = source?.pathname.startsWith("/en") ? "en" : "tr";
    const persona = source?.searchParams.get("for");
    const incomingUtm = Object.fromEntries(
      [...request.nextUrl.searchParams.entries()].filter(([key]) => /^utm_(source|medium|campaign|term|content)$/.test(key)),
    );
    await db.clickEvent.create({ data: {
      eventName: "link_click", linkId: link.id.length > 20 ? link.id : undefined,
      sessionHash, locale, persona: ["personal", "it", "investor"].includes(persona ?? "") ? persona : undefined,
      placement: "signal_hub", referrerGroup: referer ? "internal" : "direct",
      deviceClass: /mobile|android|iphone/i.test(request.headers.get("user-agent") ?? "") ? "mobile" : "desktop",
      utmJson: incomingUtm,
    } }).catch(() => undefined);
  }
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
