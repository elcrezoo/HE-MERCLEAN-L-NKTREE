export type Locale = "tr" | "en";
export type LinkItem = {
  id: string; slug: string; platform: string; category: string; destinationUrl: string;
  titleTr: string; titleEn: string; descriptionTr: string; descriptionEn: string;
  ctaTr: string; ctaEn: string; iconKey: string; accentColor: string; sortOrder: number;
  featured: boolean; active: boolean; utmJson: Record<string, string>;
};

export const links: LinkItem[] = [
  ["website","Website","official","https://heimerclean.com","HeimerClean Resmi Site","HeimerClean Official Website","Ürünü, yaklaşımı ve Heimer ekibini keşfedin","Explore the product, approach, and Heimer team",false],
  ["download","Download","official","https://heimerclean.com/download","Windows için HeimerClean","HeimerClean for Windows","30 günlük ücretsiz denemeyi başlatın","Start your 30-day free trial",true],
  ["crunchbase","Crunchbase","startup","https://www.crunchbase.com/organization/heimerclean-ai-silent-optimization","Crunchbase","Crunchbase","Şirket profilini ve startup verilerini inceleyin","Explore the company profile and startup data",true],
  ["startuplist","StartupList","startup","https://startuplist.com.tr/startup/heimerclean-ai","StartupList Türkiye","StartupList Türkiye","HeimerClean’a oy verin ve takip edin","Vote for and follow HeimerClean",true],
  ["f6s","F6S","startup","https://www.f6s.com/heimerclean-ai","F6S","F6S","Global startup profilini görüntüleyin","View the global startup profile",false],
  ["linkedin","LinkedIn","social","https://www.linkedin.com/showcase/heimerclean/posts/","LinkedIn","LinkedIn","Kurumsal güncellemeleri ve ürün içeriklerini takip edin","Follow company and product updates",true],
  ["x","X","social","https://x.com/heimerclean","X","X","Kısa duyurular ve güncellemeler","Short announcements and updates",false],
  ["youtube","YouTube","video","https://www.youtube.com/@heimerclean","YouTube","YouTube","Demo ve ürün videolarını izleyin","Watch demos and product videos",false],
  ["instagram","Instagram","social","https://www.instagram.com/heimerclean","Instagram","Instagram","Görsel ürün hikâyeleri ve duyurular","Visual product stories and announcements",false],
  ["facebook","Facebook","social","https://www.facebook.com/profile.php?id=61562742396791","Facebook","Facebook","Topluluk ve ürün paylaşımları","Community and product posts",false],
  ["tiktok","TikTok","video","https://www.tiktok.com/@heimerclean","TikTok","TikTok","Kısa ürün videoları ve ipuçları","Short product videos and tips",false],
].map((x, i) => ({
  id: x[0] as string, slug: x[0] as string, platform: x[1] as string, category: x[2] as string,
  destinationUrl: x[3] as string, titleTr: x[4] as string, titleEn: x[5] as string,
  descriptionTr: x[6] as string, descriptionEn: x[7] as string, featured: x[8] as boolean,
  ctaTr: "Aç", ctaEn: "Open", iconKey: (x[1] as string).toLowerCase(), accentColor: "#24D6C8",
  sortOrder: i + 1, active: true, utmJson: {},
}));

export const claims = [
  { id: "trial", valueShort: "30 gün", titleTr: "Ücretsiz deneme", titleEn: "Free trial", descriptionTr: "Resmi indirme sayfasında sunulan ürün teklifi.", descriptionEn: "Product offer listed on the official download page.", methodologyTr: "Resmi teklif sayfası kontrolü.", methodologyEn: "Official offer page review.", disclaimerTr: "Teklif koşulları resmi sayfada geçerlidir.", disclaimerEn: "Terms on the official page apply.", sourceType: "Product offer", sourceUrl: "https://heimerclean.com/download", status: "VERIFIED_PUBLIC", sortOrder: 1, lastVerifiedAt: "2026-09-08" },
  { id: "cleanup", valueShort: "%85", titleTr: "Ortalama temizleme verimliliği", titleEn: "Average cleanup efficiency", descriptionTr: "Resmi sitede belirtilen ürün metriği.", descriptionEn: "Product metric stated on the official website.", methodologyTr: "Yayınlanan değer; bağımsız benchmark değildir.", methodologyEn: "Published value; not an independent benchmark.", disclaimerTr: "Sonuç cihaz ve kullanıma göre değişebilir.", disclaimerEn: "Results may vary by device and usage.", sourceType: "Internal benchmark", sourceUrl: "https://heimerclean.com", status: "QUALIFIED_PUBLIC", sortOrder: 2, lastVerifiedAt: "2026-09-08" },
  { id: "scale", valueShort: "10–10.000+", titleTr: "Cihaz ölçeği için tasarlandı", titleEn: "Designed device scale", descriptionTr: "Yönetilen ortamlar için konumlandırılan merkezi yaklaşım.", descriptionEn: "A centralized approach positioned for managed environments.", methodologyTr: "Şirket profili konumlandırması; müşteri veya aktif cihaz sayısı değildir.", methodologyEn: "Company-profile positioning; not a customer or active-device count.", disclaimerTr: "Tasarlanan ölçeği ifade eder.", disclaimerEn: "Represents designed scale.", sourceType: "External profile", sourceUrl: "https://www.crunchbase.com/organization/heimerclean-ai-silent-optimization", status: "QUALIFIED_PUBLIC", sortOrder: 3, lastVerifiedAt: "2026-09-08" },
];

export const faqs = [
  ["HeimerClean nedir?","What is HeimerClean?","Windows için derin temizlik ve sessiz arka plan optimizasyonu sunan bir bakım uygulamasıdır.","It is a Windows maintenance app for deep cleanup and quiet background optimization."],
  ["Hangi işletim sistemlerinde çalışır?","Which operating systems does it support?","HeimerClean Windows için sunulmaktadır. Güncel sistem gereksinimleri için resmi indirme sayfasını kontrol edin.","HeimerClean is available for Windows. Check the official download page for current requirements."],
  ["Teknik bilgi gerekir mi?","Are technical skills required?","Hayır. Deneyim, bakım adımlarını teknik uzmanlık gerektirmeden anlaşılır kılmak üzere tasarlanmıştır.","No. The experience is designed to make maintenance understandable without technical expertise."],
  ["Arka planda nasıl çalışır?","How does it work in the background?","Performans sinyallerini değerlendirir ve uygun bakım adımlarını aktif işi mümkün olduğunca bölmeden yürütür.","It evaluates performance signals and runs suitable maintenance with minimal interruption."],
  ["Kişisel içeriklerimi buluta gönderir mi?","Does it send personal content to the cloud?","Ürün anlatısı yerel analizi ve kişisel veri sınırını vurgular. Güncel ayrıntılar için resmi gizlilik metnini inceleyin.","Product materials emphasize local analysis and personal-data boundaries. Review the current official privacy notice for details."],
  ["Bireysel ve kurumsal kullanımın farkı nedir?","What differs between personal and enterprise use?","Bireysel deneyim tek cihaz bakımına; kurumsal yaklaşım çoklu cihaz görünürlüğüne odaklanır.","Personal use focuses on one-device maintenance; enterprise positioning focuses on multi-device visibility."],
  ["Deneme süresi ne kadar?","How long is the trial?","Resmi indirme sayfasında 30 günlük ücretsiz deneme sunulmaktadır.","The official download page offers a 30-day free trial."],
  ["Demo veya iş ortaklığı için nasıl iletişime geçebilirim?","How can I discuss a demo or partnership?","Resmi site ve LinkedIn profili üzerinden HeimerClean ekibine ulaşabilirsiniz.","Reach the HeimerClean team through the official site or LinkedIn profile."],
].map((x, i) => ({ id: `faq-${i + 1}`, questionTr: x[0], questionEn: x[1], answerTr: x[2], answerEn: x[3], sortOrder: i + 1, enabled: true }));

export const copy = {
  tr: {
    nav: ["Problem","Nasıl çalışır?","Kanıtlar","Bağlantılar"], eyebrow: "Yerel Yapay Zekâ • Sessiz Optimizasyon • Windows",
    hero: "Bilgisayar yavaşlamadan önce harekete geçen akıllı bakım katmanı.",
    sub: "HeimerClean, performans sinyallerini cihaz üzerinde analiz eder; gereksiz dosyaları temizler, kaynak kullanımını dengeler ve optimizasyonu siz çalışırken arka planda yürütür.",
    primary: "Windows için ücretsiz dene", secondary: "60 saniyede nasıl çalıştığını gör",
    trust: "30 gün ücretsiz • Teknik bilgi gerekmez • Gizlilik odaklı yerel çalışma",
  },
  en: {
    nav: ["Problem","How it works","Proof","Links"], eyebrow: "On-device AI • Silent optimization • Windows",
    hero: "The intelligent maintenance layer that acts before slowdowns take over.",
    sub: "HeimerClean analyzes performance signals on the device, clears unnecessary files, balances resource usage, and keeps optimization running quietly while you work.",
    primary: "Try it free for Windows", secondary: "See how it works in 60 seconds",
    trust: "30 days free • No technical skills required • Privacy-first local operation",
  },
};
