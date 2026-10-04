# Deploy Plan: Vercel + Supabase + Cloudflare (R2)

Scope fase ini: **MVP deploy** — web + API live, Supabase jadi database, Cloudflare untuk DNS
(rakitweb.id) dan R2 sebagai bucket asset. Payment tetap stub, belum ada auth akun, belum ada
jalur provisioning yang memanggil `GeneratorService.buildPlan`.

Keputusan yang sudah disepakati:

- **Web (`apps/web`) di Vercel** — project terpisah, root directory `apps/web`.
- **API (`apps/api`, NestJS) di Vercel juga** — project terpisah, root directory `apps/api`,
  dijadikan serverless handler (bukan `app.listen()`), di-compile dulu dengan tsc/nest build.
- **Database di Supabase** — Prisma pakai connection string mode **Transaction pooler (6543)**.
- **Cloudflare = DNS + R2 bucket** (`assets.rakitweb.id`) untuk asset statis.
  Bukan Cloudflare Pages/Workers untuk app-nya.

Prinsip tetap berlaku dari `CLAUDE.md`: business logic cuma di `apps/api`; `apps/web` cuma
rendering + panggil API; AI tidak pernah menentukan harga/fitur.

---

## Phase 0 — Rapikan repo (monorepo readable oleh Vercel)

- [x] Buat root `package.json` dengan npm workspaces (`apps/*`, `packages/*`)
      — sekarang repo **tidak punya root package.json**, padahal `apps/web` bergantung ke
      `packages/*` lewat dependency `file:`. Ini juga menghilangkan warning
      "multiple lockfiles" di Next build dan bikin instalasi dikenali monorepo.
- [x] Kompres 5 JPEG hero di `apps/web/public` (total **20 MB**, ~4 MB per file) jadi
      ≤1600px / quality ~70 → target ~300 KB. **Filename tetap sama** supaya `globals.css`
      tidak perlu diubah di phase ini.
- [x] Verifikasi: `npm install` dari root, lalu test package + `apps/web` build tetap hijau.
- [x] Root `.gitignore` — repo belum punya satu, jadi `.env` dan `node_modules` bisa ikut
      ke-commit. Sekarang `node_modules/`, `.env*`, `dist/`, `.next/`, `test-results/`
      masuk daftar abaikan.
- [x] `apps/api` lint: ada script `lint` tapi **tidak ada `eslint.config.*`** — ESLint 9
      gagal begitu script-nya dijalankan. Config ditambahkan (`eslint.config.mjs`); hasilnya
      menemukan kode mati (`productSchema`/`checkoutSchema` yang tidak terpakai endpoint
      mana pun, import `templateRowData` dan `ANSWERS`/`PrismaService` di test) plus tiga
      `any` yang diganti tipe Prisma aslinya. Tercatat: sebelum ada config, `lint` di
      `apps/api` tidak pernah benar-benar jalan.
- [x] `prebuild` API → `npm run build --prefix ../../packages/planner-engine`
      (`@umkm/planner-engine` di-*build* sebelum `nest build`, kalau tidak, tsc membaca
      `dist/` yang belum ada). `pretest` → `prisma generate` + build package yang sama,
      supaya test bisa jalan dari kondisi clean.
- [x] Script root: `build:api`, `build`, `test:unit`, `test:api`, `test:e2e`, `lint`.

## Phase 1 — Supabase sebagai database

- [x] Buat project Supabase, ambil connection string (isi langsung di dashboard, **jangan
      kirim ke chat**), mode Transaction pooler (port 6543).
- [x] Jalanin di `apps/api`:
      ```bash
      npx prisma migrate deploy   # termasuk 20260929000000_order_snapshot
      npm run templates:import
      ```
      **Catatan:** dua perintah di atas tidak bisa jalan lewat pooler 6543. Prisma schema
      engine memakai prepared statement — di balik pgBouncer mode transaction muncul
      `ERROR: prepared statement "s1" already exists`, lalu `P1017: Server has closed the
      connection`. Migrasi harus lewat **direct connection (`db.<ref>.supabase.co:5432`)**.
      `DATABASE_URL` di `.env` ditukar ke direct hanya saat `prisma:deploy` + `templates:import`,
      lalu dikembalikan ke pooler 6543 untuk runtime.
- [x] **Verifikasi kritis**: `createCheckout` memakai `$transaction` interaktif (callback) —
      lolos. Checkout dijalankan lokal dengan `DATABASE_URL` pooler 6543 terhadap Supabase
      dan berhasil, jadi interactive transaction tidak perlu diubah ke bentuk batch.
- [ ] Supabase Auth belum dipakai — biarkan dulu (fase ini cuma Postgres).

## Phase 2 — API NestJS di Vercel (paling tricky)

- [x] **Handler, bukan `app.listen()`**: `main.ts` sekarang cuma `await app.listen(PORT)`
      (process harus hidup terus). Tambah entry: `await app.init()` lalu export Express
      instance sebagai default export `(req, res) => app(req, res)`.
      `main.ts` lama tetap untuk local dev.
- [x] **Compile dulu dengan tsc/nest build, jangan bundler Vercel.** NestJS butuh
      `emitDecoratorMetadata` untuk DI; esbuild (yang dipakai Vercel untuk file TS) tidak bisa
      menghasilkan metadata itu. Jadi: `npm run build` (nest build) seperti biasa, lalu file
      entry cukup require hasil `dist/`. Entry ini sengaja dibuat **tanpa decorator** supaya
      aman di-bundle Vercel.
- [x] **Routing prefix**: `setGlobalPrefix("api")` harus ketemu dengan path mapping Vercel
      untuk file di folder `api/`. Dites di deployment preview; kalau path ke-strip, atur di
      entry handler.

      **Ketemu masalahnya di production (2026-10-04).** Preset framework NestJS di Vercel
      menghasilkan route bawaan `{ "src": "^/api(/.*)?$", "status": 404 }` yang **membunuh
      semua `/api/*` sebelum function sempat dipanggil**, plus route `{ "src": "/(.*)" }` yang
      mengarahkan sisanya ke function kedua (`dist/src/main.js`) — file yang memanggil
      `app.listen()` dan tidak pernah jalan benar di serverless. Solusi:
      1. `apps/api/vercel.json` menambah `rewrites` `/api/:path*` → `/api/index`.
         Vercel menempatkan rule ini **sebelum** rule 404 bawaan, jadi hanya urutan yang berubah.
      2. Handler membaca `?path=…` dari rewrite itu (`normalizedUrl`), dengan fallback strip
         prefix `/api` untuk kasus hit langsung. 13 kasus unit-coba lulus.
      Hasil production: `GET /api/features` 200, `GET /api/website-flow/categories` 200
      (artiinya **Prisma → Supabase dari Vercel jalan**), `GET /api/prototype/sample` 200,
      `OPTIONS` preflight 204.
- [x] `package.json` API: tambah `postinstall: prisma generate` (client ter-generate tiap build).
- [x] Entry file: set `maxDuration` eksplisit (mis. 30s). Risiko: `AiService.generate()`
      bisa 2 model × 2 percobaan dengan backoff → bisa >10 detik, melebihi timeout Hobby.
- [ ] Env project Vercel API: `DATABASE_URL` (pooler), `GEMINI_API_KEY`,
      `AI_PLANNER_CONTENT_ENABLED=true`, `CORS_ORIGINS=https://rakitweb.id,https://www.rakitweb.id`.
      Untuk preview deploy sementara: `CORS_ORIGINS=https://<project>.vercel.app`.
      (`vercel env ls production` sudah menunjukkan keempat key terdaftar di `bagas4/api`.)
- [x] **Boot fix `ERR_REQUIRE_ESM`**: `planner-engine` dibuild sebagai ESM (`type: module` +
      `module: NodeNext`), sedangkan Nest API adalah CommonJS dan memakainya di banyak service.
      Node 22.23 lokal mengizinkan `require(esm)` — jadi lolos di local, crash di runtime
      Vercel. Package kini di-build CJS (`module: CommonJS`, tanpa `type: module`).
      Verifikasi hijau: build API, smoke `require()` + load `AppModule`, planner-engine
      51 tests, core-frontend build + 15 tests, `tsc --noEmit` web & api.
      Perlu deploy ulang untuk konfirmasi di production.

### Deploy API — jalur yang benar

Setup project `bagas4/api`: Root Directory **`apps/api`** (di Settings → Build and Deployment)
plus toggle **"Include files outside of the Root Directory in the Build & Installation"**
(dibutuhkan supaya `packages/planner-engine` ikut terbaca). Empat env production sudah ter-set.

Vercel selalu menjumlahkan **`--cwd` + Root Directory**, jadi deploy harus diperintah dari
**repo root**. Dari folder `apps/api` (tempat `project.json` berada):

```bash
npx vercel --cwd ../.. --project api deploy --prod
```

| Mencoba | Hasil |
| --- | --- |
| `vercel deploy --prod` dari `apps/api` | `apps/api/apps/api` — duplikat, path tidak ada |
| `vercel --cwd ..` | `apps/apps/api` — base-nya folder `apps`, bukan repo |
| `vercel --cwd ../.. --project api deploy --prod` | ✅ sukses |

Catatan:
- **`--project api`** wajib, karena `project.json` ada di `apps/api` sedangkan cwd digeser ke root.
- Opsi `--cwd`/`--project` harus **sebelum** sub-perintah (`vercel logs --cwd …` salah urutan →
  kebaca sebagai path → `Can't deploy more than one path`).
- `vercel curl` mentah-mentah meneruskan sisa argumen ke `curl` (`curl: option --cwd is unknown`) →
  pakai `curl -i` biasa saja.
- Output build di `.vercel/output`: handler `apps/api/api/index.js` berdiri di function folder
  `api/index.func`, `maxDuration: 30` masuk `.vc-config.json`, `dist/` + `node_modules` ikut
  kebawa — jadi mekanisme entry-nya sudah terverifikasi.

### Jalur kerja deploy API

`vercel` login sudah aktif di mesin pengguna. Karena `apps/api` masih `apps/api` di monorepo,
dua pilihan project di dashboard Vercel:

1. **Satu project dengan beberapa root** — tidak didukung Vercel untuk app terpisah.
2. **Dua project** (`bagas4/web` sudah ada, tinggal buat satu lagi untuk API) — **pilih ini**,
   root directory `apps/api`, framework **Other**, build command & install command ikut
   `apps/api/vercel.json` (Vercel membaca file itu dari root build).

Langkahnya: `cd apps/api && npx vercel link --yes` (project baru) → set env → `npx vercel build`
→ `npx vercel deploy --prod`. Setelah deploy, URL-nya ditaruh ke `NEXT_PUBLIC_API_URL` project
web + redeploy.

### Catatan implementasi Phase 2 (perubahan dari rencana awal)

Entri dibuat sebagai **`apps/api/api/index.js` dalam CommonJS**, bukan `api/index.ts`:

- Vercel mengompilasi entry `.ts` dengan esbuild. `emitDecoratorMetadata` tidak dihasilkan
  esbuild, sehingga DI NestJS gagal kalau ada kode yang dikompilasi bundler. Dengan `.js`
  murni CJS tanpa decorator, bundler Vercel tidak menyentuh apa pun — risiko itu hilang.
- Pola `export default function` di `.js` membuat Node mendeteksinya sebagai ESM
  (`ReferenceError: require is not defined in ES module scope`), jadi entrynya
  `module.exports = handler`.
- Prefix: handler memanggil **`app.init()` tanpa `setGlobalPrefix`**, lalu menormalisasi
  `req.url` dengan `req.url.replace(/^\/api(?=\/|\?|$)/, "")` sebelum menyerahkannya ke
  express. Dua kemungkinan bacaan Vercel (path asli vs path tujuan rewrite) jatuh ke rute
  yang sama. `main.ts` untuk local dev tetap memakai prefix `/api`.
- Pengiriman request: NestApplication membuat `http.Server` di atas instance miliknya
  sendiri lewat `initHttpServer` (never listen); `app.getHttpServer().emit("request", req, res)`
  meneruskan request ke instance itu tanpa port.
- CORS dijalankan sebagai middleware express (`app.enableCors`) sehingga berlaku tanpa
  server nyata; `OPTIONS` dijawab langsung oleh handler — Vercel kadang menjawab preflight
  sendiri sebelum runtime melihatnya, sehingga browser tidak punya tempat membaca kebijakan
  CORS.
- Timeout ditaruh di `apps/api/vercel.json` (`functions."api/*.js".maxDuration = 30`)
  sebagai tempat resmi dokumentasi Vercel.
- Risiko yang belum bisa diverifikasi lokal (butuh deploy preview): bentuk `vercel.json`
  (`outputDirectory: dist`, `buildCommand: npm run build`, `installCommand: npm install`)
  dan apakah `maxDuration: 30` di-`functions` pattern cocok dengan pola file entry.
  Vercel CLI sudah terpasang tapi belum login, jadi `vercel build` belum bisa dijalankan.
- Verifikasi lokal yang sudah lolos (di atas Postgres lokal): GET `/api/features` 200,
  GET `/features` 200 (normalisasi prefix bekerja dua arah), POST `/api/planner/start` 201,
  404 untuk rute tak dikenal, preflight 204 dengan `access-control-allow-origin` hanya
  untuk origin di `CORS_ORIGINS`, dan 503 (bukan stack trace) bila database tidak terhubung.

## Phase 2b — Web di Vercel

- [ ] Project terpisah, root `apps/web`, framework Next.js.
- [ ] Env: `NEXT_PUBLIC_API_URL=https://api.rakitweb.id/api`
      (di-inline saat **build time** — harus terisi sebelum build pertama).
- [ ] Verifikasi flow di domain preview: kategori → template → data → draft AI → preview →
      domain → checkout.

## Phase 4 — Cloudflare: DNS + bucket asset

- [ ] DNS: apex + `www` → proxied ke Vercel (project web), `api.rakitweb.id` → proxied ke
      project API. Always Use HTTPS.
- [ ] Buat R2 bucket, aktifkan custom domain `assets.rakitweb.id` (CDN + egress gratis).
- [ ] Upload 5 JPEG hasil kompresi dengan `Cache-Control: public, max-age=31536000, immutable`.
- [ ] Ganti `globals.css` `url("/umkm-kuliner.jpeg")` → `url("https://assets.rakitweb.id/…")`.
      SVG kecil (logo, icon) tetap di `public/`.
- [ ] **Sekarang belum ada fitur upload gambar** (template `contentSchema` tidak punya field
      image, tidak ada model media di Prisma). R2 fase ini untuk asset statis marketing saja.
      Struktur disiapkan dari awal: nanti upload client via **presigned URL dari API**
      (kredensial R2 cuma di Vercel env), key disimpan di DB. Jangan simpan gambar client
      di bucket public polos.
- [ ] Kalau nanti output generator mau di-host → bucket Pages/Workers terpisah per order
      (di luar scope MVP).

## Phase 5 — CI/CD

- [x] GitHub Actions di `main` (`.github/workflows/ci.yml`):
      install → build packages → `prisma:deploy` + `templates:import` → vitest
      (planner-engine + core-frontend) → jest API dengan service container `postgres:16` →
      tsc dua app → eslint → playwright.
      Tidak ada secret yang dipakai: AI test memaksa `GEMINI_API_KEY` kosong.
- [x] `prisma:deploy` + `templates:import` langkah terpisah setelah install/build — bukan di
      dalam build command (mencegah balapan antar deploy paralel).
- [x] `apps/web`: `pretest:e2e` mem-build web dengan `NEXT_PUBLIC_API_URL=http://localhost:3211/api`.
      Tanpa ini `next build` meng-inline fallback `localhost:3001` → semua panggilan API di E2E
      gagal "Failed to fetch". Ditemukan saat run E2E penuh pertama setelah Phase 0.
      `playwright.config.ts` juga mewarisi `NEXT_PUBLIC_API_URL` dari environment.
- [x] Verifikasi lokal: `tsc` api+web bersih, `lint` bersih, 51+15 unit test, 52 API test,
      E2E flag ON 4 lulus / 1 skip, E2E flag OFF 4 lulus / 1 skip.

---

## Checklist verifikasi sebelum dinyatakan selesai

- [ ] Checkout bikin `OrderSnapshot` di Supabase.
- [ ] Draft AI balas dari `api.rakitweb.id`.
- [ ] Harga tidak berubah walau template diedit setelah checkout
      (sudah dicover test `generator.spec.ts`).
- [ ] CORS bersih dari domain live.
- [ ] Halaman homepage < 1 MB setelah gambar pindah ke R2.
- [ ] `AI_PLANNER_CONTENT_ENABLED=false` tetap menyembunyikan panel draft.

## Risiko non-teknis

Lisensi **Vercel Hobby** default untuk proyek non-komersil; `rakitweb.id` menjual jasa ke UMKM,
jadi cek lagi syaratnya — kalau dihitung komersial, Pro (±$20/bln) jadi syarat. Supabase free
tier (500 MB DB) dan R2 (10 GB, tanpa egress fee) cukup untuk MVP.
