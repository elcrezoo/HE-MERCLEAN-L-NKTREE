import { PrismaClient } from "@prisma/client";
import { statSync } from "node:fs";
import { join } from "node:path";
import { claims, faqs, links } from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSetting.upsert({
    where: { id: "site" }, update: {},
    create: { id: "site", defaultLocale: "en", supportedLocales: "tr,en", siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", brandName: "HeimerClean", themeJson: { bg: "#070912", surface: "#0E1220", primary: "#6D5EF8", signal: "#24D6C8" } },
  });
  const defaultMedia = [
    { storageKey: "/brand/heimerclean-character.png", usageKey: "profile_logo", altTr: "HeimerClean karakter logosu", altEn: "HeimerClean character logo" },
    { storageKey: "/brand/heimerclean-wordmark-light.png", usageKey: "wordmark", altTr: "HeimerClean yatay logosu", altEn: "HeimerClean horizontal logo" },
    { storageKey: "/product/dashboard.png", usageKey: "product_dashboard", altTr: "HeimerClean kontrol paneli", altEn: "HeimerClean dashboard" },
    { storageKey: "/product/report.png", usageKey: "product_report", altTr: "HeimerClean rapor ekranı", altEn: "HeimerClean report screen" },
    { storageKey: "/product/performance.png", usageKey: "product_performance", altTr: "HeimerClean performans ekranı", altEn: "HeimerClean performance screen" },
  ];
  for (const asset of defaultMedia) {
    const assigned = await prisma.mediaAsset.findUnique({ where: { usageKey: asset.usageKey } });
    const diskPath = join(process.cwd(), "public", asset.storageKey.replace(/^\//, ""));
    await prisma.mediaAsset.upsert({
      where: { storageKey: asset.storageKey },
      update: {},
      create: {
        id: crypto.randomUUID(), ...asset, usageKey: assigned ? null : asset.usageKey,
        mimeType: "image/png", sizeBytes: statSync(diskPath).size, checksum: `bundled:${asset.storageKey}`,
      },
    });
  }
  for (const link of links) await prisma.link.upsert({
    where: { slug: link.slug }, update: {},
    create: { ...link, id: crypto.randomUUID(), utmJson: link.utmJson },
  });
  for (const claim of claims) await prisma.claim.upsert({
    where: { id: claim.id }, update: {},
    create: {
      ...claim, status: claim.status as "VERIFIED_PUBLIC" | "QUALIFIED_PUBLIC",
      disclaimerTr: claim.disclaimerTr, disclaimerEn: claim.disclaimerEn,
      lastVerifiedAt: new Date(claim.lastVerifiedAt),
    },
  });
  const draftClaims = [
    { id: "deeper-clean", valueShort: "%50’ye kadar", titleTr: "Karşılaştırmalı derin temizlik", titleEn: "Comparative deep cleanup", descriptionTr: "Yöntem ve cihaz seti eklenmeden yayınlanmaz.", descriptionEn: "Not published without methodology and device set.", sourceType: "Internal benchmark", sortOrder: 10 },
    { id: "interventions", valueShort: "≈%30", titleTr: "Teknik müdahale azalması", titleEn: "Technical intervention reduction", descriptionTr: "Pilot raporu olmadan yayınlanmaz.", descriptionEn: "Not published without a pilot report.", sourceType: "Pilot result", sortOrder: 11 },
    { id: "energy", valueShort: "≈%15,6", titleTr: "Enerji etkisi", titleEn: "Energy impact", descriptionTr: "Test ortamı olmadan yayınlanmaz.", descriptionEn: "Not published without a test environment.", sourceType: "Internal benchmark", sortOrder: 12 },
  ];
  for (const claim of draftClaims) await prisma.claim.upsert({ where: { id: claim.id }, update: {}, create: { ...claim, methodologyTr: "Doğrulama bekliyor.", methodologyEn: "Pending verification.", disclaimerTr: "Public değildir.", disclaimerEn: "Not public.", status: "DRAFT" } });
  for (const faq of faqs) await prisma.faq.upsert({ where: { id: faq.id }, update: {}, create: faq });
  const sections = ["hero","persona","problem","before-after","how-it-works","solutions","claims","privacy","profiles","links","faq","final-cta"];
  for (const [index, type] of sections.entries()) await prisma.pageSection.upsert({ where: { type }, update: {}, create: { id: crypto.randomUUID(), type, sortOrder: index + 1, configJson: {} } });
  for (const locale of ["tr","en"]) for (const entry of [
    ["hero.title", locale === "tr" ? "Bilgisayar yavaşlamadan önce harekete geçen akıllı bakım katmanı." : "The intelligent maintenance layer that acts before slowdowns take over."],
    ["footer.tagline", "Built for quieter, healthier Windows devices."],
  ]) await prisma.contentEntry.upsert({ where: { key_locale: { key: entry[0], locale } }, update: {}, create: { id: crypto.randomUUID(), key: entry[0], locale, valueJson: { text: entry[1] } } });
  if (await prisma.publishedRevision.count() === 0) {
    const [savedLinks, savedClaims, savedFaqs, content, pageSections] = await Promise.all([prisma.link.findMany(), prisma.claim.findMany(), prisma.faq.findMany(), prisma.contentEntry.findMany(), prisma.pageSection.findMany()]);
    await prisma.publishedRevision.create({ data: { versionNumber: 1, snapshotJson: JSON.parse(JSON.stringify({ links: savedLinks, claims: savedClaims, faqs: savedFaqs, content, pageSections })) } });
  }
  console.log("Seed complete. Existing records were preserved.");
}

main().finally(() => prisma.$disconnect());
