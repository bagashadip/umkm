"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Check, Layers3, Loader2, X } from "lucide-react";
import { PrototypeRenderer, type PrototypeConfig } from "@umkm/core-frontend";
import { Button } from "@/components/ui/button";

type TemplateCardData = {
  id: string;
  name: string;
  description: string;
  version: number;
  pricePlan: string;
  previewImage?: string | null;
  tags?: string[];
  features?: string[];
  dynamic?: boolean;
  swatches?: string[];
  sectionOrder?: string[];
  categoryId?: string;
  categoryName?: string;
  categories?: string[];
};

type TemplatePreviewData = {
  id: string;
  name: string;
  version: number;
  dynamic: boolean;
  previewConfig: PrototypeConfig | null;
};

const SAFE_SWATCHES = ["#264653", "#E9C46A", "#E76F51"];

export function TemplateCard({
  template,
  categoryNames,
  onPreview,
}: {
  template: TemplateCardData;
  categoryNames: Map<string, string>;
  onPreview: () => void;
}) {
  const categories = [
    template.categoryName,
    ...(template.categories ?? []).map((id) => categoryNames.get(id) ?? id),
  ].filter((value): value is string => Boolean(value));

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-white transition duration-200 hover:-translate-y-1 hover:border-navy/35 hover:shadow-[0_24px_70px_-36px_rgba(25,52,62,0.5)]">
      <button type="button" onClick={onPreview} className="block w-full text-left focus-visible:outline-offset-[-4px]">
        <TemplateArt template={template} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="display text-2xl text-navy">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{template.description}</p>
            </div>
            <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-bold text-mute">v{template.version}</span>
          </div>
          {categories.length > 0 && <p className="mt-4 text-xs font-bold text-mute">{Array.from(new Set(categories)).join(" · ")}</p>}
          {template.tags && template.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{template.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-sand/45 px-2.5 py-1 text-[0.6875rem] font-bold capitalize text-navy">{tag.replaceAll("-", " ")}</span>)}</div>}
          {template.sectionOrder && template.sectionOrder.length > 0 && <div className="mt-4 flex items-center gap-2 text-xs text-mute"><Layers3 className="size-3.5 shrink-0" aria-hidden /><span>{template.sectionOrder.map((section) => sectionLabel(section)).join(" · ")}</span></div>}
          <div className="mt-5 flex items-center justify-between border-t border-navy/10 pt-4">
            <span className="text-xs font-bold text-mute">{template.dynamic ? "Form khusus template" : "Form standar"}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-coral">Lihat preview <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
          </div>
        </div>
      </button>
    </article>
  );
}

function TemplateArt({ template }: { template: TemplateCardData }) {
  if (template.previewImage) {
    return <div className="relative h-52 overflow-hidden bg-paper sm:h-56"><Image src={template.previewImage} alt={`Preview template ${template.name}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /><div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy/30 to-transparent" /><PaletteSwatches colors={template.swatches} /></div>;
  }

  const colors = template.swatches?.length ? template.swatches : SAFE_SWATCHES;
  const sections = template.sectionOrder ?? [];
  const editorial = template.tags?.includes("editorial") || template.tags?.includes("story-led");

  return (
    <div className="relative h-52 overflow-hidden p-5 sm:h-56" style={{ backgroundColor: colors[0] }}>
      <div className="absolute inset-0 opacity-35" style={{ background: `radial-gradient(ellipse at 85% 15%, ${colors[1] ?? SAFE_SWATCHES[1]} 0%, transparent 56%), radial-gradient(ellipse at 4% 100%, ${colors[2] ?? SAFE_SWATCHES[2]} 0%, transparent 44%)` }} />
      <div className="absolute -right-12 -top-16 size-56 rounded-full border border-white/15" />
      <div className="absolute -right-5 -top-9 size-40 rounded-full border border-white/15" />
      <div className={`relative flex h-full items-end ${editorial ? "justify-end" : "justify-center"}`}>
        <div className={`w-full max-w-[17rem] overflow-hidden border border-white/25 bg-[#fcfaf5] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)] ${editorial ? "rounded-t-[1.25rem] rounded-bl-[1.25rem] rounded-br-sm" : "rounded-2xl"}`}>
          <div className="flex items-center justify-between border-b border-navy/10 px-3 py-2"><span className="size-1.5 rounded-full" style={{ backgroundColor: colors[2] ?? SAFE_SWATCHES[2] }} /><span className="ml-auto flex gap-1"><i className="h-1 w-4 rounded-full bg-navy/20" /><i className="h-1 w-4 rounded-full bg-navy/10" /></span></div>
          <div className={`grid gap-3 p-3 ${editorial ? "grid-cols-[1.1fr_0.9fr] items-center" : "grid-cols-1"}`}>
            <div><div className="h-1 w-9 rounded-full" style={{ backgroundColor: colors[2] ?? SAFE_SWATCHES[2] }} /><div className="mt-2 h-2 w-4/5 rounded-full" style={{ backgroundColor: colors[0] }} /><div className="mt-1.5 h-1 w-full rounded-full bg-navy/15" /><div className="mt-1 h-1 w-3/4 rounded-full bg-navy/10" /><div className="mt-3 h-4 w-14 rounded-full" style={{ backgroundColor: colors[1] ?? SAFE_SWATCHES[1] }} /></div>
            {editorial && <div className="relative aspect-[4/5] overflow-hidden rounded-lg" style={{ background: `linear-gradient(145deg, ${colors[1] ?? SAFE_SWATCHES[1]}, ${colors[2] ?? SAFE_SWATCHES[2]})` }}><span className="absolute -bottom-2 -right-2 size-12 rounded-full" style={{ backgroundColor: colors[0] }} /></div>}
          </div>
          {sections.length > 0 && <div className="flex gap-1.5 px-3 pb-3">{sections.slice(0, 5).map((section, index) => <span key={`${section}-${index}`} className="h-1 rounded-full" style={{ width: `${Math.max(12, 100 / sections.length)}%`, backgroundColor: index % 2 === 0 ? colors[0] : `${colors[0]}55` }} />)}</div>}
        </div>
      </div>
      <PaletteSwatches colors={colors} />
      <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur">{editorial ? "Editorial" : "Commerce"}</span>
    </div>
  );
}

function PaletteSwatches({ colors }: { colors?: string[] }) {
  const values = colors?.length ? colors : SAFE_SWATCHES;
  return <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 p-1.5 shadow-sm backdrop-blur" aria-label="Warna tema template">{values.slice(0, 4).map((color, index) => <span key={`${color}-${index}`} title={color} className="size-3 rounded-full ring-1 ring-navy/10" style={{ backgroundColor: color }} />)}</div>;
}

export function TemplatePreviewDialog({
  template,
  preview,
  loading,
  working,
  onClose,
  onChoose,
}: {
  template: TemplateCardData;
  preview: TemplatePreviewData | null;
  loading: boolean;
  working: boolean;
  onClose: () => void;
  onChoose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={`Template preview: ${template.name}`} className="flex max-h-[96svh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.75rem] bg-paper shadow-2xl sm:max-h-[92svh] sm:rounded-[1.75rem]">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-navy/10 px-5 py-4 sm:px-7">
          <div><p className="label text-coral">Template preview</p><h2 id="template-preview-title" className="display mt-1 text-2xl sm:text-3xl">{template.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="Tutup preview" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-navy transition hover:bg-sand"><X className="size-5" /></button>
        </header>
        <div className="min-h-0 grow overflow-y-auto">
          <div className="mx-auto max-w-5xl px-5 py-5 sm:px-8 sm:py-7">
            <p className="max-w-3xl leading-7 text-mute">{template.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{(template.tags ?? []).map((tag) => <span key={tag} className="rounded-full bg-sand/45 px-3 py-1 text-xs font-bold capitalize text-navy">{tag.replaceAll("-", " ")}</span>)}</div>
          </div>
          <div className="mx-auto max-w-5xl px-3 pb-5 sm:px-8 sm:pb-8">
            <div className="overflow-hidden rounded-2xl border border-navy/15 bg-white shadow-[0_24px_70px_-36px_rgba(25,52,62,0.5)] sm:rounded-3xl">
              <div className="flex items-center gap-2 border-b border-navy/10 bg-white px-4 py-3"><span className="size-2 rounded-full bg-coral" /><span className="size-2 rounded-full bg-sand" /><span className="size-2 rounded-full bg-teal" /><span className="ml-3 min-w-0 truncate rounded-full bg-paper px-3 py-1 text-[0.6875rem] font-bold text-mute">preview · {preview?.previewConfig?.businessName ?? template.name}</span><span className="ml-auto hidden text-xs font-bold text-mute sm:inline">{preview?.previewConfig?.businessType ?? "Template"}</span></div>
              {loading ? <div className="flex min-h-[24rem] items-center justify-center gap-3 text-mute"><Loader2 className="size-5 animate-spin" />Merakit preview…</div> : preview?.previewConfig ? <div className="max-h-[62svh] overflow-y-auto sm:max-h-[65svh]"><PrototypeRenderer config={preview.previewConfig} /></div> : <div className="p-8 text-center sm:p-16"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sand text-navy"><Layers3 className="size-6" /></div><h3 className="display mt-5 text-2xl">Preview sedang disiapkan</h3><p className="mx-auto mt-3 max-w-md leading-7 text-mute">Template ini belum punya contoh konten. Kamu tetap bisa memilih, lalu isian usahamu akan membentuk preview-nya.</p></div>}
            </div>
          </div>
        </div>
        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-navy/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs leading-5 text-mute">Contoh tampilan menggunakan konten sample. Hasil akhir mengikuti data usahamu.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row"><Button variant="outline" onClick={onClose}>Kembali ke katalog</Button><Button disabled={working} onClick={onChoose}>Gunakan template ini <Check /></Button></div>
        </footer>
      </section>
    </div>
  );
}

function sectionLabel(type: string): string {
  const labels: Record<string, string> = {
    hero: "Pembuka", about: "Cerita", productList: "Katalog", gallery: "Galeri",
    feature: "Keunggulan", testimonial: "Testimoni", contact: "Kontak",
    whatsappCta: "WhatsApp", paymentInstruction: "Pembayaran", footer: "Footer",
  };
  return labels[type] ?? type;
}
