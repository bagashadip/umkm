import Link from "next/link";
import {
  LayoutPanelTop,
  ListChecks,
  Wallet,
  Search,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DevicePreview } from "@/components/preview/device-preview";
import { RakitwebLogo } from "@/components/brand/logo";

/* ── Content ───────────────────────────────────────────────────── */
const pains = [
  "Calon pembeli tanya satu-satu lewat WhatsApp sampai jam istirahat terganggu.",
  "Produk dipajang di media sosial, tapi tidak muncul waktu dicari di Google.",
  "Belum punya website sendiri, jadi bisnismu dinilai kurang meyakinkan.",
  "Ditawari bikin website, biaya dan isinya tidak jelas dari awal.",
];

const features = [
  {
    icon: LayoutPanelTop,
    title: "Punya halaman resmi yang siap dipakai",
    body: "Ada alamat online untuk dibagikan ke pelanggan dan calon pembeli baru. Tinggal kirim link, tidak perlu menjelaskan dari nol.",
    spec: "Halaman bisnis · siap dibagikan",
    lead: true,
    wide: false,
  },
  {
    icon: ListChecks,
    title: "Katalog produk dalam satu halaman",
    body: "Nama, harga, dan foto produk tertata rapi.",
    spec: "Harga kelihatan",
    wide: false,
  },
  {
    icon: Wallet,
    title: "Pesanan tanpa bolak-balik konfirmasi",
    body: "Detail pesanan dan pembayaran manual tercatat rapi.",
    spec: "Pesanan tercatat",
    wide: true,
  },
  {
    icon: Search,
    title: "Muncul di Google waktu calon pembeli mencari",
    body: "Judul dan keterangan halaman sudah disiapkan, jadi bisnismu lebih gampang ditemukan tanpa kamu pusing soal teknis.",
    spec: "Mudah ditemukan",
    wide: false,
  },
  {
    icon: MessageCircle,
    title: "Balas calon pembeli dari WhatsApp",
    body: "Satu tekan, chat masuk ke nomor usahamu.",
    spec: "Chat ke nomor usaha",
    wide: true,
  },
];

const steps = [
  { n: "1", title: "Kategori bisnis", body: "Mulai dari jenis usahamu supaya pilihan template terasa relevan." },
  { n: "2", title: "Template", body: "Pilih arah visual yang paling cocok dengan cara kamu melayani pelanggan." },
  { n: "3", title: "Preview", body: "Isi data usaha dan lihat bentuk website sebelum memutuskan." },
  { n: "4", title: "Checkout", body: "Cek domain, lihat harga dari aturan sistem, lalu catat pembayaran." },
];

const testimonials = [
  { id: "testimonial-1", name: "[Nama UMKM]", city: "[Kota]", quote: "[Testimoni asli tampil di sini.]" },
  { id: "testimonial-2", name: "[Nama UMKM]", city: "[Kota]", quote: "[Testimoni asli tampil di sini.]" },
  { id: "testimonial-3", name: "[Nama UMKM]", city: "[Kota]", quote: "[Testimoni asli tampil di sini.]" },
];

const plans = [
  { name: "Uji Coba", note: "Placeholder — menunggu aturan harga" },
  { name: "Bisnis", note: "Placeholder — menunggu aturan harga" },
  { name: "Tumbuh", note: "Placeholder — menunggu aturan harga" },
];

const faqs = [
  {
    q: "Berapa harganya?",
    a: "Angka belum kami pasang di halaman ini karena bergantung pada isi rencana usahamu. Lewat alur ini kamu sudah tahu biayanya sebelum sepakat, jadi tidak ada biaya mendadak.",
  },
  {
    q: "Berapa lama sampai jadinya?",
    a: "Waktunya ikut banyaknya isi rencana. Jadwalnya dibahas lebih dulu sebelum pengerjaan dimulai, jadi kamu tahu kapan selesainya.",
  },
  {
    q: "Saya harus bisa coding tidak?",
    a: "Tidak perlu sama sekali. Kamu cuma mengisi data usaha dan memilih template; sisanya dikerjakan tim.",
  },
  {
    q: "Pakai alamat web sendiri bisa?",
    a: "Bisa. Alamat web atas nama usahamu sendiri, dan prosesnya dibantu dari awal.",
  },
  {
    q: "Setelah jadi, diapakan?",
    a: "Kamu dikasih cara pakainya: cara mengganti gambar, mengubah harga, dan menambah produk sendiri tanpa bantuan orang teknis.",
  },
  {
    q: "Nanti mau tambah fitur, bisa?",
    a: "Bisa. Rencana ditambah, biayanya dihitung ulang lalu disampaikan lebih dulu sebelum dikerjakan.",
  },
];

const nav = [
  ["Masalah", "#masalah"],
  ["Fitur", "#fitur"],
  ["Cara kerja", "#cara-kerja"],
  ["Harga", "#harga"],
  ["FAQ", "#faq"],
];

/* ── Page ──────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-navy focus:px-4 focus:py-2 focus:text-paper"
      >
        Lompat ke konten
      </a>

      <header className="rakitweb-home-header sticky top-0 z-40 border-b border-white/10 backdrop-blur-md">
        <div className="container flex items-center gap-6 py-4">
          <RakitwebLogo />
          <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-7 md:flex">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-bold text-[#FCFAF5] transition-colors hover:text-coral"
              >
                {label}
              </a>
            ))}
          </nav>
          <Button asChild size="sm" className="ml-auto md:ml-0">
            <Link href="/planner">Mulai buat website</Link>
          </Button>
        </div>
      </header>

      <main id="isi">
        {/* ── HERO ── */}
        <section className="rakitweb-hero relative flex min-h-[100svh] items-center overflow-hidden">
          <div className="rakitweb-photo-collage" aria-hidden="true">
            <span className="rakitweb-photo rakitweb-photo-one" />
            <span className="rakitweb-photo rakitweb-photo-two" />
            <span className="rakitweb-photo rakitweb-photo-three" />
            <span className="rakitweb-photo rakitweb-photo-four" />
            <span className="rakitweb-photo rakitweb-photo-five" />
          </div>
          <div className="rakitweb-hero-shade" aria-hidden="true" />
          <div className="rakitweb-hero-content container relative grid gap-3 py-7 md:grid-cols-[45fr_55fr] md:items-center md:gap-12 md:py-20">
            <div className="settle">
              <h1 className="display text-[clamp(2.25rem,6.5vw,4.5rem)] text-[#FCFAF5]">
                Usahamu punya <span className="text-teal">tempat sendiri</span> di internet.
              </h1>
              <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-mute md:mt-6 md:text-lg">
                Pelanggan mencari dulu sebelum membeli. Pilih kategori dan template usahamu, lihat bentuk websitenya, lalu mulai bangun tempat online milikmu.
              </p>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Button asChild size="lg">
                  <Link href="/planner">
                    Mulai buat website <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#cara-kerja">Lihat cara kerjanya</a>
                </Button>
              </div>
              <p className="mt-5 flex items-start gap-2.5 text-sm leading-relaxed text-mute">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sand" aria-hidden />
                <span>
                  Harga dan daftar fitur ditentukan aturan di sistem, bukan oleh AI — jadi angkanya bisa
                  dijelaskan.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ── FACT STRIP ── */}
        <section className="bg-navy">
          <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-5 text-center">
            <p className="text-sm font-bold text-sand">
              Harga dan daftar fitur ditentukan aturan di sistem, bukan oleh AI.
            </p>
            <p className="text-sm text-paper/70">Angkanya bisa dijelaskan dan diaudit.</p>
          </div>
        </section>

        {/* ── TEMPLATE SHOWCASE ── */}
        <section id="template" className="band bg-paper">
          <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div>
              <p className="label text-coral">Dibuat untuk cara usahamu berjalan</p>
              <h2 className="register display mt-4 max-w-[15ch] text-[clamp(2rem,5vw,3.5rem)] text-navy">
                Pilih tampilan yang terasa pas sejak pertama dilihat.
              </h2>
              <p className="mt-5 max-w-[46ch] leading-relaxed text-mute">
                Mulai dari kategori bisnismu, lalu pilih template yang paling cocok untuk memperkenalkan produk,
                layanan, dan cerita di balik usahamu.
              </p>
              <Button asChild className="mt-8">
                <Link href="/planner">Lihat pilihan template <ArrowRight aria-hidden /></Link>
              </Button>
            </div>
            <div className="settle-late">
              <DevicePreview />
            </div>
          </div>
        </section>

        {/* ── MASALAH ── */}
        <section id="masalah" className="band bg-paper">
          <div className="container">
            <h2 className="register display max-w-[18ch] text-[clamp(2rem,5vw,3.5rem)] text-navy">
              Pernah begini?
            </h2>
            <ol className="mt-10 border-t border-[var(--color-border)]">
              {pains.map((pain) => (
                <li
                  key={pain}
                  className="border-b border-[var(--color-border)] py-6 text-lg leading-snug text-navy sm:text-xl"
                >
                  {pain}
                </li>
              ))}
            </ol>
            <Button asChild className="mt-9">
              <Link href="/planner">Mulai dari kategori</Link>
            </Button>
          </div>
        </section>

        {/* ── FITUR (bento) ── */}
        <section id="fitur" className="band bg-paper pt-0">
          <div className="container">
            <h2 className="register display max-w-[20ch] text-[clamp(2rem,5vw,3.5rem)] text-navy">
              Biar calon pembeli percaya sebelum pesan
            </h2>

            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                const lead = "lead" in f && f.lead;
                return (
                  <li
                    key={f.title}
                    className={[
                      "flex flex-col justify-between gap-5 rounded-[var(--radius)] p-6 sm:p-7",
                      lead
                        ? "bg-navy text-paper md:col-span-2 md:row-span-2 md:p-9"
                        : f.wide
                          ? "border border-[var(--color-border)] bg-white md:col-span-2"
                          : "border border-[var(--color-border)] bg-white",
                    ].join(" ")}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand text-navy">
                      <Icon className="size-5" aria-hidden strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3
                        className={
                          lead
                            ? "display max-w-[16ch] text-3xl sm:text-4xl"
                            : "text-lg font-bold leading-snug text-navy"
                        }
                      >
                        {f.title}
                      </h3>
                      <p
                        className={
                          lead
                            ? "mt-4 max-w-[52ch] leading-relaxed text-paper/75"
                            : "mt-2 max-w-[58ch] leading-relaxed text-mute"
                        }
                      >
                        {f.body}
                      </p>
                    </div>
                    <p
                      className={
                        lead
                          ? "text-sm font-bold uppercase tracking-wide text-sand"
                          : "text-xs font-bold uppercase tracking-wide text-coral"
                      }
                    >
                      {f.spec}
                    </p>
                  </li>
                );
              })}
            </ul>

            <Button asChild className="mt-10">
              <Link href="/planner">Mulai buat website</Link>
            </Button>
          </div>
        </section>

        {/* ── CARA KERJA ── */}
        <section id="cara-kerja" className="band bg-navy">
          <div className="container">
            <h2 className="register display max-w-[16ch] text-[clamp(2rem,5vw,3.5rem)] text-sand">
              Dari isian sampai jadi, tanpa kamu pusing
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n} className="border-t border-paper/25 pt-6">
                  <span className="display block text-5xl text-coral">{s.n}</span>
                  <h3 className="display mt-3 text-2xl text-paper">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/75">{s.body}</p>
                </li>
              ))}
            </ol>
            <Button asChild className="mt-12" variant="secondary">
              <Link href="/planner">Mulai buat website</Link>
            </Button>
          </div>
        </section>

        {/* ── HARGA ── */}
        <section id="harga" className="band bg-paper">
          <div className="container grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <h2 className="register display max-w-[16ch] text-[clamp(2rem,5vw,3.5rem)] text-navy">
                Harga disebut di depan, bukan belakangan
              </h2>
              <p className="mt-5 max-w-[48ch] leading-relaxed text-mute">
                Angka masih kami siapkan — bagian ini placeholder. Yang pasti, tidak ada biaya mendadak di
                tengah jalan. Lihat dulu bentuk websitemu lewat alur singkat ini.
              </p>
              <Button asChild className="mt-8">
                <Link href="/planner">Lihat gambaran biaya</Link>
              </Button>
            </div>

            <Card className="bg-sand">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-2xl">Paket</CardTitle>
                  <Badge variant="accent">Masih placeholder</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-[var(--color-navy)]/15">
                  {plans.map((p) => (
                    <li
                      key={p.name}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                    >
                      <span className="display text-2xl text-navy">{p.name}</span>
                      <span className="text-sm font-bold uppercase tracking-wide text-mute">{p.note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="cerita" className="band bg-apricot">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="register display max-w-[16ch] text-[clamp(2rem,5vw,3.5rem)] text-navy">
                Usaha yang sedang melangkah
              </h2>
              <Badge variant="outline">Placeholder · menunggu data asli</Badge>
            </div>
            <p className="mt-5 max-w-[52ch] text-mute">
              Cerita pelanggan asli akan tampil di sini setelah datanya tersedia. Kami tidak mengarang angka
              atau testimoni.
            </p>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="rounded-[var(--radius)] bg-white p-6">
                  <p className="text-lg font-bold leading-snug text-navy">“{t.quote}”</p>
                  <footer className="mt-5 text-sm font-bold uppercase tracking-wide text-mute">
                    {t.name} · {t.city}
                  </footer>
                </blockquote>
              ))}
            </div>
            <p className="mt-8 text-sm font-bold uppercase tracking-wide text-mute">
              [Jumlah UMKM yang terdaftar] · placeholder
            </p>
            <Button asChild className="mt-7">
              <Link href="/planner">Gabung, mulai dari alur ini</Link>
            </Button>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="band bg-paper">
          <div className="container">
            <h2 className="register display max-w-[18ch] text-[clamp(2rem,5vw,3.5rem)] text-navy">
              Pertanyaan yang sering ditanyakan
            </h2>
            <Accordion type="single" collapsible className="mt-8 border-t border-[var(--color-border)]">
              {faqs.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Button asChild className="mt-9">
              <Link href="/planner">Masih ragu? Mulai buat website dulu</Link>
            </Button>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="coba" className="band bg-navy-deep">
          <div className="container text-center">
            <h2 className="register mx-auto max-w-[18ch] text-[clamp(2.25rem,6vw,4.5rem)] text-paper">
              Isi 5 menit, tahu langkah berikutnya
            </h2>
            <p className="mx-auto mt-6 max-w-[46ch] leading-relaxed text-paper/75">
              Ceritakan usahamu. Dapat gambaran kebutuhan dan langkah pertama yang masuk akal.
            </p>
            <div className="mt-9 flex justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/planner">
                  Mulai buat website <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-paper/15 bg-navy-deep px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="display text-lg text-paper">
            <RakitwebLogo />
          </p>
          <p className="text-sm text-paper/60">Indonesia · bahasa Indonesia</p>
        </div>
      </footer>
    </>
  );
}
