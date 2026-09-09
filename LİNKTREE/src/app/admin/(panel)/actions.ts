"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { clearSession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { safeDestination } from "@/lib/content";

const mediaSlotSchema = z.enum(["profile_logo", "wordmark", "product_dashboard", "product_report", "product_performance"]);

function ensureDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for admin writes.");
}

export async function logoutAction() { await clearSession(); redirect("/admin/login"); }

const linkSchema = z.object({
  id: z.string().min(1), titleTr: z.string().min(2).max(120), titleEn: z.string().min(2).max(120),
  descriptionTr: z.string().min(2).max(260), descriptionEn: z.string().min(2).max(260),
  destinationUrl: z.string().url(), category: z.enum(["official","startup","social","video"]),
  active: z.string().optional(), featured: z.string().optional(),
});

export async function updateLinkAction(formData: FormData) {
  const session = await requireAdmin(); ensureDatabase();
  if (session.role === "ANALYST") throw new Error("Insufficient permission.");
  const parsed = linkSchema.parse(Object.fromEntries(formData));
  if (!safeDestination(parsed.destinationUrl)) throw new Error("Only HTTP(S) destinations are allowed.");
  const before = await db.link.findUniqueOrThrow({ where: { id: parsed.id } });
  const after = await db.link.update({ where: { id: parsed.id }, data: {
    titleTr: parsed.titleTr, titleEn: parsed.titleEn, descriptionTr: parsed.descriptionTr,
    descriptionEn: parsed.descriptionEn, destinationUrl: parsed.destinationUrl, category: parsed.category,
    active: parsed.active === "on", featured: parsed.featured === "on",
  } });
  await db.auditLog.create({ data: { actorUserId: session.userId === "env-owner" ? null : session.userId, action: "UPDATE", entityType: "Link", entityId: after.id, beforeJson: before, afterJson: after } });
  revalidatePath("/", "layout");
}

const claimSchema = z.object({
  id: z.string(), valueShort: z.string().min(1).max(30), titleTr: z.string().min(2), titleEn: z.string().min(2),
  descriptionTr: z.string().min(4), descriptionEn: z.string().min(4), methodologyTr: z.string().min(4),
  methodologyEn: z.string().min(4), sourceUrl: z.string().url().or(z.literal("")), status: z.enum(["VERIFIED_PUBLIC","QUALIFIED_PUBLIC","DRAFT","EXPIRED"]),
});

export async function updateClaimAction(formData: FormData) {
  const session = await requireAdmin(); ensureDatabase();
  if (session.role === "ANALYST") throw new Error("Insufficient permission.");
  const parsed = claimSchema.parse(Object.fromEntries(formData));
  if (["VERIFIED_PUBLIC","QUALIFIED_PUBLIC"].includes(parsed.status) && !parsed.sourceUrl) throw new Error("A public claim must have a source URL.");
  const before = await db.claim.findUniqueOrThrow({ where: { id: parsed.id } });
  const after = await db.claim.update({ where: { id: parsed.id }, data: { ...parsed, sourceUrl: parsed.sourceUrl || null } });
  await db.auditLog.create({ data: { actorUserId: session.userId === "env-owner" ? null : session.userId, action: "UPDATE", entityType: "Claim", entityId: after.id, beforeJson: before, afterJson: after } });
  revalidatePath("/", "layout");
}

export async function updateSettingAction(formData: FormData) {
  const session = await requireAdmin(); ensureDatabase();
  if (session.role !== "OWNER") throw new Error("Owner permission required.");
  const brandName = z.string().min(2).max(60).parse(formData.get("brandName"));
  const siteUrl = z.string().url().parse(formData.get("siteUrl"));
  const before = await db.siteSetting.findUnique({ where: { id: "site" } });
  const after = await db.siteSetting.upsert({ where: { id: "site" }, create: { id: "site", brandName, siteUrl, themeJson: {} }, update: { brandName, siteUrl } });
  await db.auditLog.create({ data: { actorUserId: session.userId === "env-owner" ? null : session.userId, action: "UPDATE", entityType: "SiteSetting", entityId: "site", beforeJson: before ?? undefined, afterJson: after } });
}

export async function updateContentAction(formData: FormData) {
  const session = await requireAdmin(); ensureDatabase();
  if (session.role === "ANALYST") throw new Error("Insufficient permission.");
  const key = z.string().regex(/^[a-z0-9.-]+$/).parse(formData.get("key"));
  const locale = z.enum(["tr","en"]).parse(formData.get("locale"));
  const value = z.string().min(1).max(3000).parse(formData.get("value"));
  const previous = await db.contentEntry.findUnique({ where: { key_locale: { key, locale } } });
  const after = await db.contentEntry.upsert({ where: { key_locale: { key, locale } }, create: { id: crypto.randomUUID(), key, locale, valueJson: { text: value } }, update: { valueJson: { text: value } } });
  await db.auditLog.create({ data: { actorUserId: session.userId === "env-owner" ? null : session.userId, action: "UPDATE", entityType: "ContentEntry", entityId: after.id, beforeJson: previous ?? undefined, afterJson: after } });
  revalidatePath("/", "layout");
}

export async function publishAction() {
  const session = await requireAdmin(); ensureDatabase();
  if (!["OWNER","EDITOR"].includes(session.role)) throw new Error("Publishing permission required.");
  const [links, claims, faqs, content, sections] = await Promise.all([db.link.findMany(), db.claim.findMany(), db.faq.findMany(), db.contentEntry.findMany(), db.pageSection.findMany()]);
  const latest = await db.publishedRevision.aggregate({ _max: { versionNumber: true } });
  await db.publishedRevision.create({ data: { versionNumber: (latest._max.versionNumber ?? 0) + 1, snapshotJson: { links, claims, faqs, content, sections }, publishedById: session.userId === "env-owner" ? null : session.userId } });
  revalidatePath("/", "layout");
}

export async function uploadMediaAction(formData: FormData) {
  const session = await requireAdmin(); ensureDatabase();
  if (session.role === "ANALYST") throw new Error("Insufficient permission.");
  const file = formData.get("file");
  const altTr = z.string().min(2).max(240).parse(formData.get("altTr"));
  const altEn = z.string().min(2).max(240).parse(formData.get("altEn"));
  const requestedSlot = String(formData.get("usageKey") ?? "");
  const usageKey = requestedSlot ? mediaSlotSchema.parse(requestedSlot) : null;
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error("A file up to 10 MB is required.");
  const allowed = new Map([["image/png","png"],["image/jpeg","jpg"],["image/webp","webp"],["image/avif","avif"],["video/mp4","mp4"],["video/webm","webm"],["application/pdf","pdf"]]);
  const extension = allowed.get(file.type);
  if (!extension) throw new Error("Unsupported media type.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const signatures: Record<string, boolean> = {
    png: bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    jpg: bytes[0] === 0xff && bytes[1] === 0xd8, webp: bytes.subarray(8, 12).toString() === "WEBP",
    avif: bytes.subarray(4, 12).toString().includes("ftyp"), mp4: bytes.subarray(4, 12).toString().includes("ftyp"),
    webm: bytes.subarray(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])), pdf: bytes.subarray(0, 5).toString() === "%PDF-",
  };
  if (!signatures[extension]) throw new Error("File signature does not match its MIME type.");
  const name = `${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes, { flag: "wx" });
  const asset = await db.$transaction(async (tx) => {
    if (usageKey) await tx.mediaAsset.updateMany({ where: { usageKey }, data: { usageKey: null } });
    return tx.mediaAsset.create({ data: { id: randomUUID(), storageKey: `/uploads/${name}`, usageKey, mimeType: file.type, sizeBytes: file.size, altTr, altEn, checksum: createHash("sha256").update(bytes).digest("hex") } });
  });
  await db.auditLog.create({ data: { actorUserId: session.userId === "env-owner" ? null : session.userId, action: "CREATE", entityType: "MediaAsset", entityId: asset.id, afterJson: asset } });
  revalidatePath("/", "layout");
}

export async function assignMediaSlotAction(formData: FormData) {
  const session = await requireAdmin(); ensureDatabase();
  if (session.role === "ANALYST") throw new Error("Insufficient permission.");
  const id = z.string().min(1).parse(formData.get("id"));
  const requestedSlot = String(formData.get("usageKey") ?? "");
  const usageKey = requestedSlot ? mediaSlotSchema.parse(requestedSlot) : null;
  const before = await db.mediaAsset.findUniqueOrThrow({ where: { id } });
  const after = await db.$transaction(async (tx) => {
    if (usageKey) await tx.mediaAsset.updateMany({ where: { usageKey, NOT: { id } }, data: { usageKey: null } });
    return tx.mediaAsset.update({ where: { id }, data: { usageKey } });
  });
  await db.auditLog.create({ data: { actorUserId: session.userId === "env-owner" ? null : session.userId, action: "ASSIGN", entityType: "MediaAsset", entityId: id, beforeJson: before, afterJson: after } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/media");
}
