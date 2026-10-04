# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pemilik UMKM (Indonesia): pemilik bisnis kecil yang butuh kehadiran digital — website, katalog produk, dan jalur penjualan — tetapi belum punya tim teknis, waktu, atau anggaran untuk membangun sendiri.

## Product Purpose

Platform yang mengubah kebutuhan digital UMKM menjadi website dan kanal penjualan yang jalan, lewat alur terstruktur: AI Planner lalu Report, Prototype, dan Development. Sukses = pemilik UMKM memahami masalahnya, melihat alur kerjanya, dan memulai AI Planner dari landing page.

## Positioning

Harga dan daftar fitur tidak ditentukan AI. Harga datang dari aturan planner-engine di apps/api, sehingga penawaran bisa dijelaskan dan diaudit. AI hanya mengorkestrasi perencanaan; eksekusi teknis mengikuti alur empat tahap.

## Operating Context

- Monorepo: `apps/web` (Next.js, hanya rendering + pemanggilan API), `apps/api` (NestJS, seluruh logika bisnis), `packages/*` (shared).
- Landing page adalah permukaan persuasi pertama; CTA utama "Coba AI Planner".
- Kanal penjualan yang relevan bagi audiens: WhatsApp, pembayaran manual, dan SEO.

## Capabilities and Constraints

Fitur yang disebut brief dan boleh ditampilkan: landing page, product list, pembayaran manual, SEO, chat WhatsApp.

Batasan arsitektur (dari CLAUDE.md):

- Logika bisnis hanya di `apps/api`; `apps/web` tidak boleh memuat logika harga/aturan.
- Komponen UI yang dapat dipakai ulang hidup di `packages/core-frontend` dengan rendering berbasis konfigurasi (belum ada di repo).
- Skema Prisma + migrasi ditulis sebelum kode yang membutuhkan data baru.
- Perubahan logika harga/fitur wajib punya test Vitest di planner-engine.

Belum diputuskan: harga sebenarnya, paket plan, dan struktur FAQ final — semua placeholder sampai planner-engine dan pricing rules ada.

## Brand Commitments

Belum ada brand. Tidak ada nama resmi, logo, palet, atau aset. Permukaan ini memakai nama kerja "UMKM Digital Platform" dan tidak boleh mengklaim identitas yang belum dikonfirmasi.

## Evidence on Hand

Tidak ada testimoni, pelanggan, studi kasus, benchmark, angka pendapatan, atau aset marketing. Landing page dilarang mengarang klaim komersial; setiap ilustrasi data disintesis dan ditandai. Pricing section placeholder.

## Product Principles

1. Harga dan fitur datang dari rules engine, bukan dari AI.
2. Logika bisnis hidup di API, web hanya menampilkan.
3. Jelaskan nilai dalam bahasa pemilik UMKM, bukan bahasa teknis.
4. Tidak ada klaim yang tidak bisa dibuktikan.
5. Mobile-first: mayoritas audiens mengakses dari ponsel.

## Accessibility & Inclusion

Belum ada standar aksesibilitas produk yang ditetapkan. Pertahankan dasar web: semantic landmarks, kontras teks memadai, navigasi keyboard, dan label yang jelas.
