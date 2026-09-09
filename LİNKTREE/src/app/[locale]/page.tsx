import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHub } from "@/components/public-hub";
import { getPublicData } from "@/lib/content";
import type { Locale } from "@/lib/data";

export const dynamic = "force-dynamic";

const seo = {
  tr: {
    title: "HeimerClean | Yapay Zekâ Destekli Sessiz Windows Optimizasyonu",
    description: "HeimerClean’ın Windows performansını yerel yapay zekâ, sessiz optimizasyon ve derin temizlik yaklaşımıyla nasıl koruduğunu keşfedin.",
  },
  en: {
    title: "HeimerClean | AI-Powered Silent Windows Optimization",
    description: "Discover how HeimerClean uses on-device intelligence, silent optimization, and deep cleanup to maintain Windows performance.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!(locale in seo)) return {};
  const item = seo[locale as Locale];
  return {
    title: { absolute: item.title }, description: item.description,
    alternates: { canonical: `/${locale}`, languages: { "tr-TR": "/tr", en: "/en", "x-default": "/en" } },
  };
}

export default async function LocalePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ for?: string }> }) {
  const [{ locale }, query, data] = await Promise.all([params, searchParams, getPublicData()]);
  if (locale !== "tr" && locale !== "en") notFound();
  const initialPersona = ["personal", "it", "investor"].includes(query.for ?? "") ? query.for as "personal" | "it" | "investor" : undefined;
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: "HeimerClean", url: "https://heimerclean.com" },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "HeimerClean", operatingSystem: "Windows", applicationCategory: "UtilitiesApplication", offers: { "@type": "Offer", description: locale === "tr" ? "30 günlük ücretsiz deneme" : "30-day free trial" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: data.faqs.map((item) => {
      const faq = item as Record<string, unknown>;
      return { "@type": "Question", name: String(faq[locale === "tr" ? "questionTr" : "questionEn"]), acceptedAnswer: { "@type": "Answer", text: String(faq[locale === "tr" ? "answerTr" : "answerEn"]) } };
    }) },
  ];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <PublicHub locale={locale} data={data as unknown as { links: Record<string, unknown>[]; claims: Record<string, unknown>[]; faqs: Record<string, unknown>[]; content: Record<string, unknown>[]; media: Record<string, unknown>[] }} initialPersona={initialPersona} />
  </>;
}
