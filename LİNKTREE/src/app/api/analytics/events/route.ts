import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const utmSchema = z.object({
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
}).strict();

const eventSchema = z.object({
  eventName: z.enum(["page_view","qualified_page_view","persona_selected","primary_cta_click","faq_open","share_click","language_change","scroll_depth"]),
  locale: z.enum(["tr","en"]).optional(), persona: z.enum(["personal","it","investor"]).optional(),
  placement: z.string().max(60).optional(),
  deviceClass: z.enum(["desktop", "mobile", "tablet", "other"]).optional(),
  referrer: z.string().url().max(500).optional(),
  utm: utmSchema.optional(),
}).strict();

const rateWindows = new Map<string, { count: number; resetAt: number }>();

function dailySessionHash(request: NextRequest) {
  const salt = process.env.ANALYTICS_DAILY_SALT_SECRET;
  if (!salt || salt.length < 24) return null;
  const day = new Date().toISOString().slice(0, 10);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const material = `${forwarded}|${request.headers.get("user-agent") ?? ""}|${day}|${salt}`;
  return createHash("sha256").update(material).digest("hex");
}

function referrerGroup(referrer?: string) {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.") || host.includes("bing.") || host.includes("duckduckgo.")) return "search";
    if (["linkedin.com", "www.linkedin.com", "x.com", "facebook.com", "instagram.com", "tiktok.com", "youtube.com"].includes(host)) return "social";
    return "referral";
  } catch {
    return "unknown";
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 60;
}

export async function POST(request: NextRequest) {
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new NextResponse(null, { status: 204 });
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "INVALID_EVENT", message: "Invalid analytics event" }, { status: 400 });
  if (process.env.DATABASE_URL) {
    const sessionHash = dailySessionHash(request);
    if (!sessionHash) return new NextResponse(null, { status: 204 });
    if (isRateLimited(sessionHash)) return new NextResponse(null, { status: 429 });
    const { referrer, utm, ...event } = parsed.data;
    await db.clickEvent.create({
      data: {
        ...event,
        sessionHash,
        referrerGroup: referrerGroup(referrer),
        utmJson: utm ?? {},
      },
    }).catch(() => undefined);
  }
  return new NextResponse(null, { status: 204 });
}
