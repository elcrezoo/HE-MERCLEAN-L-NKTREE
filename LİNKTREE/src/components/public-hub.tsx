"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine, ArrowUpRight, Building2, Check, ChevronDown, CircleGauge,
  Facebook, Globe2, Instagram, Linkedin, MonitorCog, Moon, Music2, Rocket,
  Share2, ShieldCheck, Sparkles, Sun, Twitter, X, Youtube, Zap, ZoomIn,
} from "lucide-react";
import { copy, type Locale } from "@/lib/data";
import { localized } from "@/lib/content";

type PublicData = {
  links: Record<string, unknown>[];
  claims: Record<string, unknown>[];
  faqs: Record<string, unknown>[];
  content?: Record<string, unknown>[];
  media?: Record<string, unknown>[];
};
type Persona = "personal" | "it" | "investor";
type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

const platformIcons: Record<string, Icon> = {
  website: Globe2, download: ArrowDownToLine, crunchbase: Building2, startuplist: Rocket,
  f6s: Rocket, linkedin: Linkedin, x: Twitter, youtube: Youtube, instagram: Instagram,
  facebook: Facebook, tiktok: Music2,
};

const defaultProductPreviews = [
  { src: "/product/dashboard.png", width: 1012, height: 568, key: "dashboard", slot: "product_dashboard" },
  { src: "/product/report.png", width: 1012, height: 573, key: "report", slot: "product_report" },
  { src: "/product/performance.png", width: 1005, height: 555, key: "performance", slot: "product_performance" },
] as const;

export function PublicHub({ locale, data, initialPersona }: { locale: Locale; data: PublicData; initialPersona?: Persona }) {
  const overrides = Object.fromEntries((data.content ?? []).filter((item) => item.locale === locale).map((item) => [item.key, (item.valueJson as { text?: string })?.text]));
  const c = { ...copy[locale], hero: overrides["hero.title"] || copy[locale].hero };
  const router = useRouter();
  const [persona, setPersona] = useState<Persona>(initialPersona ?? "personal");
  const [light, setLight] = useState(false);
  const [shared, setShared] = useState(false);
  const [activePreview, setActivePreview] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const pageViewSent = useRef(false);
  const qualifiedViewSent = useRef(false);
  const tr = locale === "tr";
  const mediaBySlot = Object.fromEntries((data.media ?? []).filter((asset) => asset.usageKey).map((asset) => [String(asset.usageKey), asset]));
  const profileLogo = String(mediaBySlot.profile_logo?.storageKey ?? "/brand/heimerclean-character.png");
  const wordmark = mediaBySlot.wordmark;
  const productPreviews = defaultProductPreviews.map((preview) => {
    const asset = mediaBySlot[preview.slot];
    return {
      ...preview,
      src: String(asset?.storageKey ?? preview.src),
      alt: String(asset?.[tr ? "altTr" : "altEn"] ?? ""),
    };
  });

  const sendEvent = useCallback((eventName: "page_view" | "qualified_page_view" | "persona_selected" | "primary_cta_click", selectedPersona = persona) => {
    const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (navigator.doNotTrack === "1" || privacyNavigator.globalPrivacyControl) return;
    const params = new URLSearchParams(location.search);
    const utm = Object.fromEntries(
      [...params.entries()].filter(([key]) => /^utm_(source|medium|campaign|term|content)$/.test(key)),
    );
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        locale,
        persona: selectedPersona,
        placement: "signal_hub",
        deviceClass: /ipad|tablet/i.test(navigator.userAgent) ? "tablet" : /mobile|android|iphone/i.test(navigator.userAgent) ? "mobile" : "desktop",
        referrer: document.referrer || undefined,
        utm,
      }),
    }).catch(() => undefined);
  }, [locale, persona]);

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    if (pageViewSent.current) return;
    pageViewSent.current = true;
    sendEvent("page_view", initialPersona ?? "personal");
  }, [initialPersona, sendEvent]);
  useEffect(() => {
    const markQualified = () => {
      if (qualifiedViewSent.current) return;
      qualifiedViewSent.current = true;
      sendEvent("qualified_page_view");
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.5) markQualified();
    };
    const timer = window.setTimeout(markQualified, 10_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [sendEvent]);
  useEffect(() => {
    if (lightbox === null) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [lightbox]);

  function choose(next: Persona) {
    if (next === persona) return;
    setPersona(next);
    sessionStorage.setItem("hc-persona", next);
    sendEvent("persona_selected", next);
    router.replace(`/${locale}?for=${next}`, { scroll: false });
  }

  async function share() {
    const payload = { title: "HeimerClean", url: location.href };
    if (navigator.share) await navigator.share(payload).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  }

  const socialLinks = data.links.filter((link) => ["social", "video"].includes(String(link.category)));
  const featuredSlugs = new Set(["download", "startuplist", "crunchbase"]);
  const priorities: Record<Persona, string[]> = {
    personal: ["download", "website"],
    it: ["website", "linkedin", "download"],
    investor: ["crunchbase", "f6s", "startuplist", "website"],
  };
  const orderedLinks = [...data.links].sort((a, b) => {
    const aIndex = priorities[persona].indexOf(String(a.slug));
    const bIndex = priorities[persona].indexOf(String(b.slug));
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
  });
  const personaContent = {
    personal: {
      eyebrow: tr ? "BİREYSEL WINDOWS BAKIMI" : "PERSONAL WINDOWS CARE",
      title: tr ? "Kolay, sessiz temizlik ve optimizasyon." : "Easy, silent cleanup and optimization.",
      body: tr ? "Teknik uğraş olmadan günlük bakım için tasarlandı. Resmi indirme sayfasındaki 30 günlük ücretsiz denemeyle başlayın." : "Designed for everyday care without technical overhead. Start with the 30-day free trial on the official download page.",
      cta: tr ? "30 gün ücretsiz dene" : "Try free for 30 days",
      href: "/go/download",
    },
    it: {
      eyebrow: tr ? "KURUMSAL KONUMLANDIRMA" : "TEAM POSITIONING",
      title: tr ? "Yönetilen cihazlar için görünürlük odağı." : "A visibility focus for managed endpoints.",
      body: tr ? "Çoklu cihaz görünürlüğü, cihaz üzerindeki analiz ve gizlilik sınırı ile operasyonel raporlama değeri için konumlandırılan yaklaşımdır; yayımlanmış özellik taahhüdü değildir." : "Positioning around multi-device visibility, an on-device privacy boundary, and operational reporting value; this is not a commitment that every capability has shipped.",
      cta: tr ? "Kurumsal çözümü incele" : "Explore for teams",
      href: "/go/website",
    },
    investor: {
      eyebrow: tr ? "KAYNAKLI STARTUP PROFİLİ" : "SOURCED STARTUP PROFILE",
      title: tr ? "Windows bakım sorununa ölçeklenebilir yaklaşım." : "A scalable approach to the Windows maintenance problem.",
      body: tr ? "HeimerClean, sessiz optimizasyonu yönetilen ortam ölçeği için konumlandırır. Şirket ve ekosistem profilini bağımsız startup dizinlerinde doğrulayın." : "HeimerClean positions silent optimization for managed-environment scale. Verify the company and ecosystem profile through independent startup directories.",
      cta: tr ? "Crunchbase profilini aç" : "Open Crunchbase profile",
      href: "/go/crunchbase",
    },
  }[persona];

  return (
    <div className={light ? "site link-hub light" : "site link-hub"}>
      <a className="skip-link" href="#main">{tr ? "İçeriğe geç" : "Skip to content"}</a>
      <main id="main" className="hub-shell">
        <div className="hub-controls" aria-label={tr ? "Sayfa kontrolleri" : "Page controls"}>
          <div className="hub-language" aria-label={tr ? "Dil seçimi" : "Language selection"}>
            <Globe2 size={15} aria-hidden="true"/>
            <a href={`/tr?for=${persona}`} hrefLang="tr" lang="tr" aria-current={tr ? "page" : undefined}>TR</a>
            <span aria-hidden="true">/</span>
            <a href={`/en?for=${persona}`} hrefLang="en" lang="en" aria-current={!tr ? "page" : undefined}>EN</a>
          </div>
          <button className="hub-control" onClick={() => setLight(!light)} aria-label={tr ? "Temayı değiştir" : "Change theme"}>
            {light ? <Moon size={17}/> : <Sun size={17}/>}
          </button>
          <button className="hub-control" onClick={share} aria-label={tr ? "Sayfayı paylaş" : "Share page"}>
            {shared ? <Check size={17}/> : <Share2 size={17}/>}
          </button>
        </div>

        <header className="hub-profile">
          <div className="hub-avatar">
            <Image src={profileLogo} width={1080} height={1080} sizes="94px" alt="HeimerClean" preload/>
            <i aria-hidden="true"><ShieldCheck size={13}/></i>
          </div>
          <h1>HeimerClean</h1>
          <p>{tr ? "Windows için yerel zekâ ve sessiz optimizasyon." : "On-device intelligence and silent optimization for Windows."}</p>
          <div className="hub-socials" aria-label={tr ? "Sosyal medya" : "Social media"}>
            {socialLinks.map((link) => {
              const PlatformIcon = platformIcons[String(link.slug)] ?? ArrowUpRight;
              return <a key={String(link.id)} href={`/go/${String(link.slug)}`} target="_blank" rel="noopener noreferrer external" aria-label={String(link.platform)}><PlatformIcon size={18}/></a>;
            })}
          </div>
        </header>

        <div className="hub-personas" role="group" aria-label={tr ? "Görünümü kişiselleştir" : "Personalize view"}>
          {([
            ["personal", tr ? "Bireysel" : "Personal"],
            ["it", "IT"],
            ["investor", tr ? "Yatırımcı" : "Investor"],
          ] as [Persona, string][]).map(([id, label]) => (
            <button key={id} className={persona === id ? "active" : ""} onClick={() => choose(id)} aria-pressed={persona === id}>{label}</button>
          ))}
        </div>

        <section className={`persona-spotlight persona-${persona}`} aria-live="polite" aria-labelledby="persona-title">
          <span>{personaContent.eyebrow}</span>
          <h2 id="persona-title">{personaContent.title}</h2>
          <p>{personaContent.body}</p>
          <a href={personaContent.href} target="_blank" rel="noopener noreferrer external" onClick={() => sendEvent("primary_cta_click")}>
            {personaContent.cta}<ArrowUpRight size={16}/>
          </a>
          {persona === "investor" && <nav aria-label={tr ? "Startup doğrulama bağlantıları" : "Startup verification links"}>
            <a href="/go/f6s" target="_blank" rel="noopener noreferrer external">F6S<ArrowUpRight size={12}/></a>
            <a href="/go/startuplist" target="_blank" rel="noopener noreferrer external">StartupList<ArrowUpRight size={12}/></a>
          </nav>}
        </section>

        <section className="product-showcase" aria-labelledby="product-preview-title">
          <div className="showcase-heading">
            <div>
              <span>{tr ? "ÜRÜNÜ YAKINDAN GÖRÜN" : "SEE THE PRODUCT"}</span>
              <h2 id="product-preview-title">{tr ? "HeimerClean masaüstü uygulaması" : "The HeimerClean desktop app"}</h2>
            </div>
            <span className="showcase-live"><i/>{tr ? "Gerçek ürün" : "Real product"}</span>
          </div>
          <button
            className="preview-frame"
            type="button"
            onClick={() => setLightbox(activePreview)}
            aria-label={tr ? "Ürün ekran görüntüsünü büyüt" : "Enlarge product screenshot"}
          >
            <Image
              key={productPreviews[activePreview].src}
              src={productPreviews[activePreview].src}
              width={productPreviews[activePreview].width}
              height={productPreviews[activePreview].height}
              sizes="(max-width: 620px) calc(100vw - 40px), 556px"
              alt={productPreviews[activePreview].alt || (tr
                ? `HeimerClean ${productPreviews[activePreview].key === "dashboard" ? "kontrol paneli" : productPreviews[activePreview].key === "report" ? "rapor" : "performans"} ekranı`
                : `HeimerClean ${productPreviews[activePreview].key} screen`)}
              preload={activePreview === 0}
            />
            <span><ZoomIn size={15}/>{tr ? "Büyüt" : "Enlarge"}</span>
          </button>
          <div className="preview-tabs" role="tablist" aria-label={tr ? "Ürün ekranları" : "Product screens"}>
            {productPreviews.map((preview, index) => {
              const labels = tr
                ? { dashboard: "Kontrol paneli", report: "Raporlar", performance: "Performans" }
                : { dashboard: "Dashboard", report: "Reports", performance: "Performance" };
              return (
                <button
                  key={preview.key}
                  type="button"
                  role="tab"
                  aria-selected={activePreview === index}
                  className={activePreview === index ? "active" : ""}
                  onClick={() => setActivePreview(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>{labels[preview.key]}
                </button>
              );
            })}
          </div>
          <p className="preview-caption">
            {tr
              ? "Günlük optimizasyon, raporlama ve gelişmiş performans araçları tek uygulamada."
              : "Daily optimization, reporting, and advanced performance tools in one app."}
          </p>
        </section>

        <section className="hub-feature" aria-labelledby="feature-title">
          <div className="feature-glow"/>
          <div className="feature-kicker"><Sparkles size={14}/>{tr ? "SİZ ÇALIŞIRKEN ÇALIŞIR" : "WORKS WHILE YOU DO"}</div>
          <h2 id="feature-title">{tr ? "Yavaşlama sinyallerinden sessiz optimizasyona." : "From slowdown signals to silent optimization."}</h2>
          <div className="signal-flow" aria-label={tr ? "Kavramsal ürün çalışma modeli" : "Conceptual product operating model"}>
            <div className="signal-inputs"><span><CircleGauge size={14}/>{tr ? "Performans" : "Performance"}</span><span><MonitorCog size={14}/>{tr ? "Sistem sağlığı" : "System health"}</span></div>
            <div className="signal-line"><i/><Zap size={18}/><i/></div>
            <div className="signal-result"><span className="mini-mark"><Image src={profileLogo} width={1080} height={1080} sizes="41px" alt=""/></span><div><strong>{tr ? "Sessiz optimizasyon" : "Silent optimization"}</strong><small>{tr ? "Yerelde analiz • Kontrollü bakım" : "On-device analysis • Controlled care"}</small></div></div>
          </div>
          <p className="feature-note">{tr ? "Kavramsal ürün anlatımıdır; ölçülmüş cihaz sonucu değildir." : "Conceptual product explanation; not a measured device result."}</p>
          <Link className="feature-cta" href="/go/download">{tr ? "Windows için ücretsiz dene" : "Try it free for Windows"}<ArrowUpRight size={18}/></Link>
        </section>

        {data.claims.length > 0 && (
          <details className="hub-disclosure proof-disclosure">
            <summary><span><ShieldCheck size={18}/>{tr ? "Kaynaklı ürün bilgileri" : "Sourced product facts"}</span><ChevronDown size={18}/></summary>
            <div className="proof-list">
              {data.claims.map((claim) => (
                <a href={String(claim.sourceUrl)} target="_blank" rel="noopener noreferrer external" key={String(claim.id)}>
                  <strong>{String(claim.valueShort)}</strong><span>{localized(claim, "title", locale)}</span><ArrowUpRight size={14}/>
                </a>
              ))}
            </div>
          </details>
        )}

        <section className="hub-links" aria-labelledby="links-title">
          <div className="hub-section-title"><span>{tr ? "RESMİ BAĞLANTILAR" : "OFFICIAL LINKS"}</span><h2 id="links-title">{tr ? "HeimerClean’ı keşfedin" : "Explore HeimerClean"}</h2></div>
          <div className="link-stack">
            {orderedLinks.map((link) => {
              const slug = String(link.slug);
              const PlatformIcon = platformIcons[slug] ?? ArrowUpRight;
              const isPrimary = slug === "download";
              const isFeatured = featuredSlugs.has(slug);
              return (
                <a className={`hub-link${isPrimary ? " primary" : isFeatured ? " featured" : ""}`} href={`/go/${slug}`} target="_blank" rel="noopener noreferrer external" key={String(link.id)}>
                  <span className="hub-link-icon" style={{ "--platform": String(link.accentColor || "#83d1d1") } as CSSProperties}><PlatformIcon size={20}/></span>
                  <span className="hub-link-copy"><strong>{localized(link, "title", locale)}</strong><small>{localized(link, "description", locale)}</small></span>
                  {isFeatured && <span className="featured-label">{isPrimary ? (tr ? "ÖNERİLEN" : "RECOMMENDED") : (tr ? "ÖNE ÇIKAN" : "FEATURED")}</span>}
                  <ArrowUpRight className="hub-link-arrow" size={18}/>
                </a>
              );
            })}
          </div>
        </section>

        <details className="hub-disclosure why-card">
          <summary><span><Zap size={18}/>{tr ? "Neden HeimerClean?" : "Why HeimerClean?"}</span><ChevronDown size={18}/></summary>
          <div className="why-content">
            <p>{c.hero}</p>
            <ol>
              <li><strong>{tr ? "Analiz" : "Analyze"}</strong><span>{tr ? "Performans sinyallerini cihazda değerlendirir." : "Evaluates performance signals on the device."}</span></li>
              <li><strong>{tr ? "Optimize et" : "Optimize"}</strong><span>{tr ? "Uygun bakım adımlarını sessizce yürütür." : "Runs suitable maintenance quietly."}</span></li>
              <li><strong>{tr ? "Açıkla" : "Explain"}</strong><span>{tr ? "Yapılan işlemleri anlaşılır biçimde sunar." : "Presents completed actions clearly."}</span></li>
            </ol>
          </div>
        </details>

        {data.faqs.length > 0 && (
          <section className="hub-faq" aria-labelledby="faq-title">
            <h2 id="faq-title">{tr ? "Kısa yanıtlar" : "Quick answers"}</h2>
            {data.faqs.map((faq) => <details key={String(faq.id)}><summary>{localized(faq, "question", locale)}<ChevronDown size={16}/></summary><p>{localized(faq, "answer", locale)}</p></details>)}
          </section>
        )}

        <footer className="hub-footer">
          <span className="footer-wordmark" aria-hidden="true">
            {wordmark ? <Image src={String(wordmark.storageKey)} width={1021} height={175} sizes="132px" alt=""/> : <>
              <Image className="footer-wordmark-light" src="/brand/heimerclean-wordmark-light.png" width={1021} height={175} sizes="132px" alt=""/>
              <Image className="footer-wordmark-dark" src="/brand/heimerclean-wordmark-dark.png" width={1021} height={175} sizes="132px" alt=""/>
            </>}
          </span>
          <p>© {new Date().getFullYear()} HeimerClean</p>
          <span>{tr ? "Daha sessiz, daha sağlıklı Windows cihazları için." : "For quieter, healthier Windows devices."}</span>
          <small className="developer-signature">{tr ? "Enes Bozkurt tarafından geliştirildi" : "Developed by Enes Bozkurt"}</small>
        </footer>
      </main>

      {lightbox !== null && (
        <div className="product-lightbox" role="dialog" aria-modal="true" aria-label={tr ? "Büyütülmüş ürün ekranı" : "Enlarged product screen"} onMouseDown={(event) => { if (event.target === event.currentTarget) setLightbox(null); }}>
          <div className="lightbox-panel">
            <button type="button" className="lightbox-close" onClick={() => setLightbox(null)} aria-label={tr ? "Kapat" : "Close"}><X size={20}/></button>
            <Image
              src={productPreviews[lightbox].src}
              width={productPreviews[lightbox].width}
              height={productPreviews[lightbox].height}
              sizes="96vw"
              alt={productPreviews[lightbox].alt || (tr ? "Büyütülmüş HeimerClean ürün ekranı" : "Enlarged HeimerClean product screen")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
