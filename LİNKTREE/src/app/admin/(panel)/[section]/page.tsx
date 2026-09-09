import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { db, withDatabase } from "@/lib/db";
import { claims as fallbackClaims, links as fallbackLinks } from "@/lib/data";
import { assignMediaSlotAction, updateClaimAction, updateContentAction, updateLinkAction, updateSettingAction, uploadMediaAction } from "../actions";

export const dynamic = "force-dynamic";

const mediaSlots = [
  ["", "Atanmamış / Kütüphane"],
  ["profile_logo", "Profil logosu"],
  ["wordmark", "Yatay logo"],
  ["product_dashboard", "Ürün galerisi — Kontrol paneli"],
  ["product_report", "Ürün galerisi — Raporlar"],
  ["product_performance", "Ürün galerisi — Performans"],
] as const;

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "links") {
    const items = await withDatabase(() => db.link.findMany({ orderBy: { sortOrder: "asc" } }), fallbackLinks);
    return <><p className="section-kicker">Directory</p><h1>Links</h1><p className="admin-note">Changes persist immediately and are recorded in the audit log. Slugs remain stable.</p>{items.map((link) => <form action={updateLinkAction} className="admin-panel form-stack" key={link.id}>
      <input type="hidden" name="id" value={link.id}/><h2>/{link.slug}</h2>
      <label>Title (TR)<input name="titleTr" defaultValue={link.titleTr}/></label><label>Title (EN)<input name="titleEn" defaultValue={link.titleEn}/></label>
      <label>Description (TR)<textarea name="descriptionTr" defaultValue={link.descriptionTr}/></label><label>Description (EN)<textarea name="descriptionEn" defaultValue={link.descriptionEn}/></label>
      <label>Destination URL<input name="destinationUrl" type="url" defaultValue={link.destinationUrl}/></label>
      <label>Category<select name="category" defaultValue={link.category}><option value="official">Official</option><option value="startup">Startup</option><option value="social">Social</option><option value="video">Video</option></select></label>
      <label><span><input type="checkbox" name="active" defaultChecked={link.active}/> Active</span></label><label><span><input type="checkbox" name="featured" defaultChecked={link.featured}/> Featured</span></label>
      <button className="button primary">Save link</button>
    </form>)}</>;
  }
  if (section === "claims") {
    const items = await withDatabase(() => db.claim.findMany({ orderBy: { sortOrder: "asc" } }), fallbackClaims);
    return <><p className="section-kicker">Evidence registry</p><h1>Claims</h1><p className="admin-note">Draft and expired claims are excluded from public content. Public claims require a source.</p>{items.map((claim) => <form action={updateClaimAction} className="admin-panel form-stack" key={claim.id}>
      <input type="hidden" name="id" value={claim.id}/><label>Short value<input name="valueShort" defaultValue={claim.valueShort}/></label>
      <label>Title (TR)<input name="titleTr" defaultValue={claim.titleTr}/></label><label>Title (EN)<input name="titleEn" defaultValue={claim.titleEn}/></label>
      <label>Description (TR)<textarea name="descriptionTr" defaultValue={claim.descriptionTr}/></label><label>Description (EN)<textarea name="descriptionEn" defaultValue={claim.descriptionEn}/></label>
      <label>Methodology (TR)<textarea name="methodologyTr" defaultValue={claim.methodologyTr}/></label><label>Methodology (EN)<textarea name="methodologyEn" defaultValue={claim.methodologyEn}/></label>
      <label>Source URL<input name="sourceUrl" type="url" defaultValue={claim.sourceUrl ?? ""}/></label><label>Status<select name="status" defaultValue={claim.status}><option value="VERIFIED_PUBLIC">Verified public</option><option value="QUALIFIED_PUBLIC">Qualified public</option><option value="DRAFT">Draft</option><option value="EXPIRED">Expired</option></select></label>
      <button className="button primary">Save claim</button>
    </form>)}</>;
  }
  if (section === "content") return <><p className="section-kicker">Localized copy</p><h1>Content</h1><p className="admin-note">Structured entries reject HTML. Add or update a localized key for downstream publishing.</p><form action={updateContentAction} className="admin-panel form-stack"><label>Content key<input name="key" placeholder="hero.title"/></label><label>Locale<select name="locale"><option value="tr">Türkçe</option><option value="en">English</option></select></label><label>Text<textarea name="value"/></label><button className="button primary">Save content entry</button></form></>;
  if (section === "settings") {
    const setting = await withDatabase(() => db.siteSetting.findUnique({ where: { id: "site" } }), null);
    return <><p className="section-kicker">Owner controls</p><h1>Site settings</h1><form action={updateSettingAction} className="admin-panel form-stack"><label>Brand name<input name="brandName" defaultValue={setting?.brandName ?? "HeimerClean"}/></label><label>Canonical site URL<input name="siteUrl" type="url" defaultValue={setting?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/></label><button className="button primary">Save settings</button></form></>;
  }
  if (section === "media") {
    const assets = await withDatabase(() => db.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }), []);
    return <><p className="section-kicker">Marka ve ürün görselleri</p><h1>Görsel Yönetimi</h1><p className="admin-note">Yeni görseli yüklerken kullanım yerini seçin veya kütüphanedeki bir görselin yerini sonradan değiştirin. Değişiklikler public sayfaya doğrudan yansır.</p>
      <form action={uploadMediaAction} className="admin-panel form-stack">
        <label>Görsel dosyası<input name="file" type="file" required accept=".png,.jpg,.jpeg,.webp,.avif"/></label>
        <label>Kullanım yeri<select name="usageKey" defaultValue="">{mediaSlots.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Alternatif metin (TR)<input name="altTr" required/></label>
        <label>Alternative text (EN)<input name="altEn" required/></label>
        <button className="button primary">Yükle ve uygula</button>
      </form>
      <section className="admin-panel"><h2>Görsel kütüphanesi</h2>
        <div className="admin-media-grid">
          {assets.length ? assets.map((asset) => <form action={assignMediaSlotAction} className="admin-media-card" key={asset.id}>
            {asset.mimeType.startsWith("image/") ? <Image src={asset.storageKey} width={220} height={130} sizes="220px" alt={asset.altTr} style={{ objectFit:"contain" }}/> : <div className="admin-media-file">{asset.mimeType}</div>}
            <input type="hidden" name="id" value={asset.id}/>
            <strong>{asset.altTr}</strong>
            <small>{asset.storageKey} · {(asset.sizeBytes/1024).toFixed(1)} KB</small>
            <label>Kullanım yeri<select name="usageKey" defaultValue={asset.usageKey ?? ""}>{mediaSlots.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <button className="button primary">Uygula</button>
          </form>) : <p>Henüz yüklenmiş görsel yok.</p>}
        </div>
      </section>
    </>;
  }
  if (section === "analytics") {
    redirect("/admin?period=week#analytics");
  }
  if (section === "audit-log") {
    const logs = await withDatabase(() => db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }), []);
    return <><p className="section-kicker">Immutable activity</p><h1>Audit log</h1><section className="admin-panel">{logs.length ? logs.map((log) => <div className="data-row" key={log.id}><span>{log.action} {log.entityType}<small>{log.createdAt.toISOString()}</small></span><code>{log.entityId}</code></div>) : <p>No persisted changes yet.</p>}</section></>;
  }
  if (["page-builder","seo","theme"].includes(section)) redirect(section === "page-builder" ? "/admin/content" : "/admin/settings");
  if (section === "profiles") redirect("/admin/links");
  if (section === "users") return <><p className="section-kicker">Owner only</p><h1>Users</h1><p className="admin-note">Public signup is disabled. Create or rotate the first owner with <code>pnpm admin:create</code>. Additional role management is intentionally database-administered in this release.</p></>;
  notFound();
}
