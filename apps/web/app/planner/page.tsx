"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, Globe2, Loader2, Palette, Search, Store, WandSparkles, X } from "lucide-react";
import { PrototypeRenderer, type PrototypeConfig } from "@umkm/core-frontend";
import { Button } from "@/components/ui/button";
import { ContentForm } from "@/components/planner/content-form";
import { AiDraftPanel } from "@/components/planner/ai-draft-panel";
import { TemplateCard, TemplatePreviewDialog } from "@/components/planner/template-catalog";
import { RakitwebLogo } from "@/components/brand/logo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.errors?.[0]?.message ?? body.message ?? "Permintaan gagal");
  return body as T;
}

type Category = { id: string; name: string; description: string; icon: string };
type Template = { id: string; name: string; description: string; pricePlan: string; version: number; tags?: string[]; features?: string[]; modules?: string[]; dynamic?: boolean; previewImage?: string | null; swatches?: string[]; sectionOrder?: string[]; categoryId?: string; categoryName?: string; categories?: string[] };
type TemplateCatalog = { templates: Template[]; tags: string[]; total: number };
type TemplatePreview = { id: string; name: string; version: number; dynamic: boolean; previewConfig: PrototypeConfig | null };
type SchemaField = { id: string; label: string; type: string; required?: boolean; bind?: string; placeholder?: string; help?: string; maxItems?: number; group?: string; options?: Array<{ value: string; label: string }> };
type TemplateSchema = { dynamic: boolean; fields: SchemaField[]; aiSlots: string[]; aiEnabled: boolean };
type AiDraftResult = { enabled: boolean; templateId?: string; slots: string[]; source: "ai" | "form"; draft: Record<string, unknown> };
type Preview = { previewConfig: PrototypeConfig; project: { id: string; currentStep: number } };
type Checkout = { checkoutId: string; amount: number; currency: string; status: string; priceSnapshot: { breakdown: { label: string; total: number }[] } };

type Business = { name: string; tagline: string; description: string; whatsapp: string; address: string; products: Array<{ name: string; description: string; price: string }> };
const initialBusiness: Business = { name: "", tagline: "", description: "", whatsapp: "", address: "", products: [{ name: "", description: "", price: "" }] };
const steps = ["Kategori", "Template", "Data bisnis", "Preview", "Domain", "Checkout", "Pembayaran"];
  const money = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export default function PlannerPage() {
  const [sessionId, setSessionId] = useState("");
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [catalogTags, setCatalogTags] = useState<string[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogTag, setCatalogTag] = useState("");
  const [catalogSort, setCatalogSort] = useState<"curated" | "name">("curated");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<Template | null>(null);
  const [templatePreview, setTemplatePreview] = useState<TemplatePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [projectId, setProjectId] = useState("");
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [draftSource, setDraftSource] = useState<"ai" | "form">("ai");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [domain, setDomain] = useState("");
  const [domainResult, setDomainResult] = useState<{ available: boolean; domain: string } | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const requestRef = useRef(0);
  const previewRequestRef = useRef(0);
  // Linked categories are stored as ids, so cards need a lookup to show their names.
  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);
  /**
   * A template may store the name under any field id it likes, so the form's
   * "name" is whichever field is bound to that meaning — not a hard-coded key.
   */
  const businessNameValue = useMemo(() => {
    if (!schema?.dynamic) return business.name;
    const id = schema.fields.find((field) => field.bind === "businessName")?.id
      ?? schema.fields.find((field) => field.id === "name")?.id;
    return id ? String(content[id] ?? "") : business.name;
  }, [schema, content, business.name]);
  const nameReady = businessNameValue.trim().length >= 2;
  const suggestedBrief = useMemo(() => {
    if (!schema?.dynamic) return "";
    const pieces: string[] = [];
    for (const field of schema.fields) {
      if (field.id === "businessName" || field.id === "name") continue;
      const value = content[field.id];
      if (field.type === "text" || field.type === "textarea") {
        if (typeof value === "string" && value.trim()) pieces.push(value.trim());
      } else if (Array.isArray(value)) {
        for (const row of value) {
          if (!row || typeof row !== "object") continue;
          const item = row as Record<string, unknown>;
          const text = Object.values(item).filter((part): part is string => typeof part === "string" && part.trim().length > 0).join(" ");
          if (text) pieces.push(text);
        }
      }
    }
    return pieces.join(". ").slice(0, 1500);
  }, [schema, content]);
  const effectiveBrief = brief.trim() ? brief : suggestedBrief;

  useEffect(() => {
    api<{ sessionId: string }>("/planner/start", { method: "POST", body: "{}" }).then((result) => {
      setSessionId(result.sessionId);
      return api<Category[]>("/website-flow/categories");
    }).then(setCategories).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  function fail(e: unknown) { setError(e instanceof Error ? e.message : "Permintaan gagal"); setWorking(false); }

  useEffect(() => {
    if (step !== 1 || !category) return;
    const timer = window.setTimeout(() => {
      setCatalogLoading(true);
      const params = new URLSearchParams({ categoryId: category.id, sort: catalogSort });
      if (catalogQuery.trim()) params.set("q", catalogQuery.trim());
      if (catalogTag) params.set("tag", catalogTag);
      const requested = requestRef.current + 1;
      requestRef.current = requested;
      api<TemplateCatalog>(`/website-flow/templates?${params.toString()}`)
        .then((result) => {
          // A slower response from a previous category must not overwrite this one.
          if (requestRef.current !== requested) return;
          setTemplates(result.templates);
          setCatalogTags(result.tags);
        })
        .catch((e) => { if (requestRef.current === requested) setError(e instanceof Error ? e.message : "Katalog template gagal dimuat"); })
        .finally(() => { if (requestRef.current === requested) setCatalogLoading(false); });
    }, catalogQuery.trim() ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [step, category, catalogQuery, catalogTag, catalogSort, requestRef]);

  function chooseCategory(value: Category) {
    // Seed the loading state so an empty grid never flashes before the fetch starts.
    setCategory(value); setTemplate(null); setTemplates([]); setCatalogTags([]); setCatalogQuery(""); setCatalogTag(""); setCatalogLoading(true); setError(""); setStep(1);
  }
  function openTemplatePreview(value: Template) {
    setSelectedPreview(value);
    setTemplatePreview(null);
    setPreviewLoading(true);
    setError("");
    const requested = previewRequestRef.current + 1;
    previewRequestRef.current = requested;
    api<TemplatePreview>(`/website-flow/templates/${value.id}/preview`)
      .then((result) => { if (previewRequestRef.current === requested) setTemplatePreview(result); })
      .catch((e) => { if (previewRequestRef.current === requested) setError(e instanceof Error ? e.message : "Preview template gagal dimuat"); })
      .finally(() => { if (previewRequestRef.current === requested) setPreviewLoading(false); });
  }
  function chooseTemplate(value: Template) {
    if (!category || !sessionId) return;
    setTemplate(value); setError(""); setWorking(true);
    api<{ id: string }>("/website-flow/projects", { method: "POST", body: JSON.stringify({ sessionId, categoryId: category.id, templateId: value.id }) }).then((result) => {
      setProjectId(result.id);
      return api<TemplateSchema>(`/website-flow/templates/${value.id}/schema`);
    }).then((result) => {
      setSchema(result);
      setContent({});
      setBrief("");
      setDraft(null);
      setDraftEnabled(null);
      setStep(2);
    }).catch(fail).finally(() => setWorking(false));
  }
  function updateBusiness<K extends keyof Business>(key: K, value: Business[K]) { setBusiness((current) => ({ ...current, [key]: value })); }
  function draftBusinessContent() {
    if (!projectId || !schema || !effectiveBrief.trim()) return;
    if (!nameReady) {
      setError("Isi nama usaha dulu sebelum membuat draft.");
      return;
    }
    setError(""); setDraftLoading(true);
    api<AiDraftResult>(`/website-flow/projects/${projectId}/ai/draft`, {
      method: "POST",
      body: JSON.stringify({ brief: effectiveBrief, businessName: businessNameValue.trim() }),
    }).then((result) => {
      setDraftEnabled(result.enabled);
      if (!result.enabled) {
        setSchema((current) => current ? { ...current, aiEnabled: false } : current);
        return;
      }
      setDraft(result.draft);
      setDraftSource(result.source);
    }).catch((e) => setError(e instanceof Error ? e.message : "Draft gagal dibuat")).finally(() => setDraftLoading(false));
  }
  function applyDraft() {
    if (!draft || !schema) return;
    const allowed = new Set(schema.aiSlots);
    setContent((current) => {
      const next = { ...current };
      for (const [id, value] of Object.entries(draft)) {
        if (allowed.has(id) && schema.fields.some((field) => field.id === id)) next[id] = value;
      }
      return next;
    });
    setDraft(null);
  }

  function saveBusiness() {
    setError(""); setWorking(true);
    const payload = schema?.dynamic
      ? content
      : { ...business, products: business.products.filter((item) => item.name.trim()) };
    api<Preview>(`/website-flow/projects/${projectId}/business`, { method: "POST", body: JSON.stringify(payload) }).then((result) => { setPreview(result); setStep(3); }).catch(fail).finally(() => setWorking(false));
  }
  function checkDomain() {
    setError(""); setWorking(true);
    api<{ available: boolean; domain: string }>(`/website-flow/projects/${projectId}/domain`, { method: "POST", body: JSON.stringify({ domain }) }).then((result) => { setDomainResult(result); setStep(5); }).catch(fail).finally(() => setWorking(false));
  }
  function createCheckout() {
    setError(""); setWorking(true);
    api<Checkout>(`/website-flow/projects/${projectId}/checkout`, { method: "POST", body: "{}" }).then((result) => { setCheckout(result); setStep(6); }).catch(fail).finally(() => setWorking(false));
  }
  function pay() {
    if (!checkout) return;
    setError(""); setWorking(true);
    api<{ paymentStatus: string }>(`/website-flow/checkout/${checkout.checkoutId}/payment`, { method: "POST", body: JSON.stringify({ method: "stub", reference: "web-demo" }) }).then((result) => setPaymentStatus(result.paymentStatus)).catch(fail).finally(() => setWorking(false));
  }
  function previous() { setError(""); setStep((value) => Math.max(0, value - 1)); }

  return <main className="min-h-screen bg-paper text-navy">
    <header className="border-b border-[var(--color-border)] bg-paper/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><RakitwebLogo compact /><span className="text-sm font-bold text-mute">Rancang website kamu</span></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-10"><p className="label text-coral">Website configurator</p><h1 className="display mt-3 max-w-2xl text-[clamp(2.4rem,6vw,4.8rem)]">Mulai dari cara usahamu dilihat.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-mute">Pilih arah visual, isi cerita usahamu, lalu lihat bentuk websitenya sebelum memutuskan.</p></div>
      <nav aria-label="Langkah pembuatan website" className="mb-10 overflow-x-auto pb-2"><ol className="flex min-w-[660px] items-center gap-1">{steps.map((label, index) => <li key={label} className="flex flex-1 items-center gap-2"><span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${index < step ? "bg-sand text-navy" : index === step ? "bg-navy text-paper" : "bg-navy/10 text-mute"}`}>{index < step ? <Check className="size-4" /> : index + 1}</span><span className={`text-xs font-bold ${index === step ? "text-navy" : "text-mute"}`}>{label}</span>{index < steps.length - 1 && <span className="mx-1 h-px flex-1 bg-navy/15" />}</li>)}</ol></nav>
      {loading ? <Loading label="Menyiapkan pilihan untukmu..." /> : <>
        {error && <div role="alert" className="mb-6 rounded-2xl border border-coral/30 bg-coral/10 px-5 py-4 font-bold text-coral-deep">{error}</div>}
        {step === 0 && <section><StepIntro icon={<Store />} title="Kategori bisnis" body="Kategori membantu kami menampilkan pola website yang relevan untuk usahamu." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map((item) => <button key={item.id} disabled={working} onClick={() => chooseCategory(item)} className="group rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left transition hover:-translate-y-1 hover:border-navy hover:shadow-xl disabled:opacity-60"><span className="mb-8 flex size-11 items-center justify-center rounded-xl bg-sand text-navy"><Palette className="size-5" /></span><strong className="block text-lg">{item.name}</strong><span className="mt-2 block text-sm leading-6 text-mute">{item.description}</span><span className="mt-5 flex items-center gap-2 text-sm font-extrabold text-coral">Pilih kategori <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></button>)}</div></section>}
        {step === 1 && <section>
          <StepIntro icon={<Palette />} title={`Pilih gaya untuk ${category?.name}`} body="Cari tampilan yang paling pas. Buka preview untuk melihat susunan dan gaya halaman sebelum kamu memilih." />
          <div className="mb-6 grid gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-input)] px-4 focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
              <Search className="size-4 shrink-0 text-mute" aria-hidden />
              <span className="sr-only">Cari template</span>
              <input value={catalogQuery} onChange={(e) => setCatalogQuery(e.target.value)} placeholder="Cari gaya, nama template, atau kategori" className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-mute/75" />
              {catalogQuery && <button type="button" aria-label="Hapus pencarian" onClick={() => setCatalogQuery("")} className="rounded-full p-1 text-mute hover:bg-paper"><X className="size-4" /></button>}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-mute">
              <span>Urutkan</span>
              <select value={catalogSort} onChange={(e) => setCatalogSort(e.target.value as "curated" | "name")} className="min-h-12 rounded-2xl border border-[var(--color-input)] bg-white px-3 text-navy outline-none focus:border-coral">
                <option value="curated">Pilihan Rakitweb</option>
                <option value="name">Nama A–Z</option>
              </select>
            </label>
            {catalogTags.length > 0 && <div className="flex flex-wrap gap-2 sm:col-span-2" aria-label="Filter gaya template">
              <button type="button" onClick={() => setCatalogTag("")} aria-pressed={!catalogTag} className={`rounded-full px-4 py-2 text-sm font-bold transition ${!catalogTag ? "bg-navy text-paper" : "bg-paper text-mute hover:bg-sand/60"}`}>Semua gaya</button>
              {catalogTags.map((tag) => <button key={tag} type="button" onClick={() => setCatalogTag((current) => current === tag ? "" : tag)} aria-pressed={catalogTag === tag} className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${catalogTag === tag ? "bg-navy text-paper" : "bg-paper text-mute hover:bg-sand/60"}`}>{tag.replaceAll("-", " ")}</button>)}
            </div>}
            <p className="text-sm text-mute sm:col-span-2">{catalogLoading ? "Mencari template…" : `${templates.length} template untuk ${category?.name ?? "kategori ini"}`}</p>
          </div>

          {catalogLoading && templates.length === 0 ? <Loading label="Membuka katalog template…" /> : templates.length === 0 ? <div className="rounded-3xl border border-dashed border-navy/20 bg-white px-6 py-12 text-center"><h3 className="display text-2xl">Belum ada template yang cocok</h3><p className="mx-auto mt-3 max-w-md leading-7 text-mute">Coba kata pencarian lain atau hapus filter gaya.</p><Button variant="outline" onClick={() => { setCatalogQuery(""); setCatalogTag(""); }} className="mt-5">Hapus filter</Button></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((item) => <TemplateCard key={item.id} template={item} categoryNames={categoryById} onPreview={() => openTemplatePreview(item)} />)}
          </div>}
          <Back onClick={previous} />
          {selectedPreview && <TemplatePreviewDialog
            template={selectedPreview}
            preview={templatePreview}
            loading={previewLoading}
            working={working}
            onClose={() => { setSelectedPreview(null); setTemplatePreview(null); }}
            onChoose={() => { const value = selectedPreview; setSelectedPreview(null); setTemplatePreview(null); chooseTemplate(value); }}
          />}
        </section>}

        {step === 2 && <section className="max-w-3xl"><StepIntro icon={<Store />} title="Ceritakan usahamu" body={schema?.dynamic ? "Template ini punya isian sendiri. Isi yang sudah siap dulu — nanti bisa disempurnakan." : "Data ini menjadi bahan langsung untuk preview. Isi yang sudah siap dulu — nanti bisa disempurnakan."} /><div className="space-y-5 rounded-3xl border border-[var(--color-border)] bg-white p-5 sm:p-8">{schema?.dynamic ? <><ContentForm fields={schema.fields} values={content} onChange={(id, value) => setContent((current) => ({ ...current, [id]: value }))} /><AiDraftPanel slots={schema.aiSlots} fields={schema.fields} content={content} draft={draft} source={draftSource} brief={brief} suggestedBrief={suggestedBrief} loading={draftLoading} enabled={schema.aiEnabled && draftEnabled !== false} ready={nameReady} onBrief={setBrief} onRequest={draftBusinessContent} onApply={applyDraft} onDismiss={() => setDraft(null)} /></> : <LegacyBusinessForm business={business} updateBusiness={updateBusiness} />}<Button disabled={working || !nameReady} onClick={saveBusiness} className="mt-3 w-full sm:w-auto">Lihat preview <ArrowRight /></Button></div><Back onClick={previous} /></section>}
        {step === 3 && <section><StepIntro icon={<WandSparkles />} title="Ini bentuk awal websitemu" body="Preview ini dirakit dari template, kategori, dan data yang baru kamu isi." /><div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-2xl"><div className="flex items-center gap-2 border-b border-navy/10 bg-paper px-5 py-3"><span className="size-2 rounded-full bg-coral" /><span className="size-2 rounded-full bg-sand-deep" /><span className="size-2 rounded-full bg-navy/20" /><span className="ml-4 text-xs font-bold text-mute">preview — {business.name}</span></div>{preview && <PrototypeRenderer config={preview.previewConfig} />}</div><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => setStep(4)}>Lanjut cek domain <ArrowRight /></Button><Button variant="outline" onClick={() => setStep(2)}>Ubah data</Button></div></section>}
        {step === 4 && <section className="max-w-2xl"><StepIntro icon={<Globe2 />} title="Punya alamat yang ingin dipakai?" body="Cek ini masih simulasi. Provider domain nyata bisa disambungkan setelah alur produk tervalidasi." /><div className="rounded-3xl border border-[var(--color-border)] bg-white p-5 sm:p-8"><label className="block"><span className="text-sm font-bold">Nama domain</span><div className="mt-2 flex rounded-2xl border border-[var(--color-input)] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20"><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="usahaku.id" className="min-w-0 grow rounded-2xl px-4 py-4 outline-none" /><span className="flex items-center border-l border-navy/10 px-4 text-sm font-bold text-mute">.id</span></div></label><p className="mt-4 text-sm text-mute">Coba <strong>taken-contoh.id</strong> untuk melihat simulasi domain tidak tersedia.</p>{domainResult && <p className={`mt-5 rounded-2xl p-4 font-bold ${domainResult.available ? "bg-sand text-navy" : "bg-coral/10 text-coral-deep"}`}>{domainResult.available ? `Domain ${domainResult.domain} tersedia.` : `Domain ${domainResult.domain} belum tersedia.`}</p>}<Button disabled={working || domain.trim().length < 3} onClick={checkDomain} className="mt-6">Cek domain <Globe2 /></Button><button type="button" onClick={() => { setDomainResult(null); setStep(5); }} className="ml-4 text-sm font-bold text-mute underline">Lewati dulu</button></div><Back onClick={() => setStep(3)} /></section>}
        {step === 5 && <section className="max-w-2xl"><StepIntro icon={<CreditCard />} title="Ringkasan pesanan" body="Harga dihitung oleh aturan di server berdasarkan paket template dan jumlah produk. Tidak bisa diubah dari browser." /><div className="rounded-3xl bg-navy p-6 text-paper sm:p-8"><div className="flex justify-between gap-6 border-b border-paper/20 pb-5"><div><p className="text-sm text-paper/65">Template</p><h2 className="mt-1 text-2xl font-extrabold">{template?.name}</h2></div><p className="text-right text-sm text-paper/65">{category?.name}<br />{domainResult?.domain || "Tanpa domain"}</p></div><div className="space-y-3 py-5">{checkout?.priceSnapshot.breakdown?.map((line) => <div key={line.label} className="flex justify-between text-sm"><span className="text-paper/70">{line.label}</span><span>{money(line.total)}</span></div>) || <p className="text-sm text-paper/70">Klik lanjut untuk menghitung harga.</p>}</div><div className="flex items-end justify-between border-t border-paper/20 pt-5"><span className="font-bold">Total</span><strong className="text-3xl">{checkout ? money(checkout.amount) : "Siap dihitung"}</strong></div><Button variant="secondary" onClick={createCheckout} disabled={working} className="mt-7 w-full">Buat checkout <ArrowRight /></Button></div><Back onClick={() => setStep(4)} /></section>}
        {step === 6 && <section className="max-w-2xl"><StepIntro icon={<CreditCard />} title="Pembayaran" body="Untuk sekarang pembayaran dicatat sebagai simulasi dan menunggu verifikasi." /><div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 sm:p-8"><div className="flex items-center justify-between border-b border-navy/10 pb-5"><span className="font-bold">Total checkout</span><strong className="text-2xl">{checkout ? money(checkout.amount) : "—"}</strong></div>{paymentStatus ? <div className="mt-6 rounded-2xl bg-sand p-5"><Check className="size-6" /><h2 className="mt-3 text-xl font-extrabold">Pembayaran tercatat</h2><p className="mt-1 text-mute">Status saat ini: menunggu verifikasi.</p></div> : <><p className="mt-6 leading-7 text-mute">Klik tombol di bawah untuk membuat payment attempt dengan provider stub.</p><Button disabled={working} onClick={pay} className="mt-6">Catat pembayaran <Check /></Button></>}</div></section>}
      </>}
    </div>
  </main>;
}

function StepIntro({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) { return <div className="mb-7"><span className="flex size-11 items-center justify-center rounded-xl bg-sand text-navy">{icon}</span><h2 className="display mt-4 text-3xl sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl leading-7 text-mute">{body}</p></div>; }
function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) { return <label className="block"><span className="text-sm font-bold">{label}{required ? <span className="text-coral"> *</span> : null}</span><input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-[var(--color-input)] px-4 py-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" /></label>; }
function Back({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-mute hover:text-navy"><ArrowLeft className="size-4" /> Kembali</button>; }
function Loading({ label }: { label: string }) { return <div className="flex min-h-64 items-center justify-center gap-3 text-mute"><Loader2 className="size-5 animate-spin" />{label}</div>; }

/** Fixed form for templates that predate the template system. */
function LegacyBusinessForm({ business, updateBusiness }: { business: Business; updateBusiness: <K extends keyof Business>(key: K, value: Business[K]) => void }) {
  return <><Field label="Nama usaha" value={business.name} onChange={(value) => updateBusiness("name", value)} placeholder="Contoh: Kedai Rasa Pagi" required /><Field label="Kalimat pembuka" value={business.tagline} onChange={(value) => updateBusiness("tagline", value)} placeholder="Contoh: Sarapan hangat setiap pagi" /><label className="block"><span className="text-sm font-bold">Cerita singkat</span><textarea value={business.description} onChange={(e) => updateBusiness("description", e.target.value)} placeholder="Apa yang membuat usaha ini berarti?" rows={4} className="mt-2 w-full rounded-2xl border border-[var(--color-input)] px-4 py-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" /></label><div className="grid gap-5 sm:grid-cols-2"><Field label="WhatsApp (opsional)" value={business.whatsapp} onChange={(value) => updateBusiness("whatsapp", value)} placeholder="0812..." /><Field label="Lokasi (opsional)" value={business.address} onChange={(value) => updateBusiness("address", value)} placeholder="Bandung" /></div><div><div className="flex items-end justify-between"><span className="text-sm font-bold">Produk atau layanan</span><button type="button" onClick={() => updateBusiness("products", [...business.products, { name: "", description: "", price: "" }])} className="text-sm font-extrabold text-coral">+ Tambah</button></div><div className="mt-3 space-y-3">{business.products.map((product, index) => <div key={index} className="grid gap-2 rounded-2xl bg-paper p-3 sm:grid-cols-[1fr_1fr_9rem]"><input aria-label={`Nama produk ${index + 1}`} value={product.name} onChange={(e) => updateBusiness("products", business.products.map((p, i) => i === index ? { ...p, name: e.target.value } : p))} placeholder="Nama produk" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" /><input aria-label={`Deskripsi produk ${index + 1}`} value={product.description} onChange={(e) => updateBusiness("products", business.products.map((p, i) => i === index ? { ...p, description: e.target.value } : p))} placeholder="Deskripsi singkat" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" /><input aria-label={`Harga produk ${index + 1}`} value={product.price} onChange={(e) => updateBusiness("products", business.products.map((p, i) => i === index ? { ...p, price: e.target.value } : p))} placeholder="Rp ..." className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" /></div>)}</div></div></>;
}
