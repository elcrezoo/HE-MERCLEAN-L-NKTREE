# HeimerClean Signal Hub

HeimerClean’ın ürün anlatısını, kaynaklı kanıtlarını, startup profillerini ve resmi bağlantılarını tek bir çift dilli deneyimde birleştiren production-oriented Next.js uygulaması.

## Product scope

- `/tr` and `/en`: server-rendered bilingual public experience with responsive “Silent Intelligence” design
- Persona-aware journeys for personal, IT, and investor visitors via shareable `?for=` URLs
- Problem, conceptual before/after model, operating model, sourced proof, privacy, link directory, FAQ, and contextual final CTA
- All 11 supplied official/startup/social destinations through tracked `/go/[slug]` routes
- Accessible keyboard navigation, skip link, visible focus, reduced-motion support, semantic FAQ, light/dark themes, mobile CTA
- Canonical/hreflang metadata, sitemap, robots rules, JSON-LD, and generated Open Graph artwork
- Private `/admin` workspace for localized content, links, claims, media, settings, analytics, audit history, and immutable publishing revisions
- Docker gerektirmeyen SQLite/Prisma persistence, idempotent seed, first-party privacy-aware events, secure password login, and SSRF-conscious link checker

No testimonial, customer count, investment, certification, or unsupported performance metric is invented. Draft claims are seeded as draft and never returned by the public content query.

## Local setup

En kolay yöntem: proje klasöründeki **`BASLAT.bat`** dosyasına çift tıklayın. İlk açılışta paketler ve yerel SQLite veritabanı otomatik hazırlanır; yalnızca admin e-posta/parolanız bir kez sorulur. Docker gerekmez.

Requirements: Node.js 22+ (24 recommended). Manuel kurulum:

```bash
corepack enable
pnpm install
copy .env.example .env
pnpm setup:local
pnpm admin:create
pnpm dev
```

Open `http://localhost:3000`. The owner creation command requests a password interactively and stores only a bcrypt hash.

Yerel veriler `prisma/dev.db` dosyasında tutulur. Bu dosyayı yedeklemek içerik ve admin verilerini yedeklemek için yeterlidir. Veritabanına erişilemezse public sayfa doğrulanmış fallback içerikle açılmaya devam eder.

For an environment-only emergency owner without a database, set `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`; generate the hash with:

```bash
node -e "require('bcryptjs').hash(process.argv[1],12).then(console.log)" "your-long-password"
```

This fallback is intentionally disabled whenever `DATABASE_URL` is configured, preventing a database outage from silently weakening authentication.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm audit --prod
```

## Operations and security

- Set a unique `AUTH_SECRET` of at least 32 random characters and a unique analytics salt.
- Terminate TLS at the deployment edge. Session cookies become `Secure` in production.
- Local uploads are stored under `public/uploads` with generated UUID names after size, MIME, and magic-byte checks. Use private object storage plus signed delivery before horizontally scaling.
- The link checker permits HTTP(S), validates every redirect hop, blocks common private/link-local/loopback ranges, uses HEAD, and has a five-second timeout.
- Raw IP addresses are not persisted. Daily visitor hashes rotate by date and configured salt. DNT and GPC suppress public event writes.
- Güncelleme öncesinde `prisma/dev.db` dosyasını yedekleyin.
- Claims marked `DRAFT` or `EXPIRED` are excluded server-side. Public statuses require a source URL.

## Deployment

Production dağıtımında kalıcı SQLite disk alanı veya yönetilen bir veritabanı adaptasyonu kullanın. Vercel gibi geçici dosya sistemlerinde veritabanı ve yüklenen medya için kalıcı harici depolama gerekir.

## Assets

The user-owned `Görseller` directory is preserved and excluded from Docker context. It contained no accessible files at build time, so the public hero uses an honest CSS signal model rather than a fabricated product screenshot. Upload verified media with bilingual alt text from `/admin/media` after database setup.

## Source specification

This README is the canonical, cleaned project guide derived from specification version 1.0 dated 8 September 2026. Accidental source line markers were removed. Product claims and platform verification dates must be reviewed and updated by an owner before launch.
