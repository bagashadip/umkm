import { MessageCircle, Search } from "lucide-react";

const products = [
  { name: "Kue Lapis", price: "Rp 25.000" },
  { name: "Nastar", price: "Rp 18.000" },
  { name: "Bolu Kukus", price: "Rp 15.000" },
];

/**
 * Synthetic preview of a finished UMKM website. HTML/CSS only — a demonstration
 * of the output, never a customer claim.
 */
function StoreScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex h-full flex-col gap-2 p-2.5" : "flex h-full flex-col gap-3 p-4"}>
      <div className="flex items-center justify-between gap-2">
        <span className={`font-bold text-navy ${compact ? "text-[7px]" : "text-[11px]"}`}>
          Kue Rumahan Ibu Sari
        </span>
        <span
          className={`rounded-full bg-sand px-1.5 py-0.5 font-bold text-navy ${
            compact ? "text-[6px]" : "text-[9px]"
          }`}
        >
          Online
        </span>
      </div>

      <div className="rounded-lg bg-sand p-2.5">
        <p className={`font-bold leading-tight text-navy ${compact ? "text-[9px]" : "text-sm"}`}>
          Kue rumahan segar tiap hari
        </p>
        <p className={`mt-1 leading-snug text-mute ${compact ? "text-[6px]" : "text-[10px]"}`}>
          Pesan hari ini, dikirim besok.
        </p>
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full bg-navy px-2 py-1 font-bold text-paper ${
            compact ? "text-[6px]" : "text-[9px]"
          }`}
        >
          Pesan via WhatsApp
        </span>
      </div>

      <div className={compact ? "grid grid-cols-3 gap-1.5" : "grid grid-cols-3 gap-2"}>
        {products.map((p) => (
          <div key={p.name} className="rounded-md border border-[var(--color-border)] bg-white p-1.5">
            <div className="h-6 rounded bg-teal/60" />
            <p className={`mt-1.5 truncate font-bold text-navy ${compact ? "text-[6px]" : "text-[9px]"}`}>
              {p.name}
            </p>
            <p className={`truncate text-mute ${compact ? "text-[5px]" : "text-[8px]"}`}>{p.price}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2">
        <span className={`text-mute ${compact ? "text-[6px]" : "text-[9px]"}`}>Bayar transfer manual</span>
        <Search className={compact ? "size-2.5 text-coral" : "size-3.5 text-coral"} aria-hidden />
      </div>
    </div>
  );
}

export function DevicePreview() {
  return (
    <figure className="relative" aria-label="Contoh tampilan website UMKM di monitor dan ponsel">
      {/* warm sand field behind the cluster */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-6 bottom-10 rounded-[2.5rem] bg-sand sm:inset-x-6 lg:inset-x-10"
      />
      <div
        aria-hidden
        className="absolute right-2 top-2 size-40 rounded-full bg-teal/70 blur-3xl"
      />

      {/* ── monitor ── */}
      <div className="relative mx-auto w-full max-w-[34rem] px-3 pt-3 sm:px-8 sm:pt-10">
        <div className="rounded-t-2xl border-[6px] border-b-0 border-navy bg-navy p-1.5 shadow-[0_40px_80px_-40px_rgb(6_22_41/0.55)]">
          <div className="flex items-center gap-1.5 rounded-t-lg bg-paper px-2.5 py-1.5">
            <span className="size-2 rounded-full bg-coral/80" />
            <span className="size-2 rounded-full bg-teal" />
            <span className="size-2 rounded-full bg-mute/40" />
            <span className="ml-2 flex-1 truncate rounded bg-white px-2 py-0.5 text-[10px] font-bold text-mute">
              warungbudi.id
            </span>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-b-lg bg-white">
            <StoreScreen />

            {/* screen annotations — coral callouts, CleanShot signature */}
          </div>
        </div>

        {/* stand */}
        <div aria-hidden className="relative mx-auto w-16">
          <div className="mx-auto h-6 w-8 bg-gradient-to-b from-navy to-navy-deep" />
          <div className="mx-auto h-2.5 w-36 rounded-full bg-navy-deep" />
        </div>
      </div>

      {/* ── phone ── */}
      <div className="absolute bottom-3 right-0 w-24 rotate-3 sm:right-4 sm:w-36 lg:right-8">
        <div className="rounded-[1.6rem] border-[5px] border-navy bg-navy p-1 shadow-[0_30px_60px_-30px_rgb(6_22_41/0.6)]">
          <div className="mx-auto mb-1 h-1 w-6 rounded-full bg-paper/30" />
          <div className="aspect-[9/16] overflow-hidden rounded-[1.1rem] bg-white">
            <StoreScreen compact />
          </div>
        </div>
        <span className="absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-full bg-coral text-white shadow-lg">
          <MessageCircle className="size-3.5" aria-hidden />
        </span>
      </div>

      <figcaption className="sr-only">
        Contoh hasil: halaman usaha dengan katalog tiga produk, tombol pesan WhatsApp, dan pilihan bayar
        transfer manual, ditampilkan pada monitor dan ponsel.
      </figcaption>
    </figure>
  );
}
