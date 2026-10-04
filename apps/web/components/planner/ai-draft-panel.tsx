"use client";

import { Loader2, Sparkles, Undo2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Field = { id: string; label: string; type: string; group?: string };

type DraftPanelProps = {
  slots: string[];
  fields: Field[];
  content: Record<string, unknown>;
  draft: Record<string, unknown> | null;
  source: "ai" | "form";
  brief: string;
  loading: boolean;
  enabled: boolean;
  /** The draft needs the business name, which sits in the form above. */
  ready: boolean;
  /** Prefilled from completed business-form fields while the client has not edited this box. */
  suggestedBrief?: string;
  onBrief: (value: string) => void;
  onRequest: () => void;
  onApply: () => void;
  onDismiss: () => void;
};

/** One glance at a value, whatever shape its field happens to use. */
function preview(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((row) => {
        if (typeof row !== "object" || row === null) return "";
        const entry = row as Record<string, unknown>;
        return ["name", "title", "label", "quote", "src"]
          .map((key) => (typeof entry[key] === "string" ? (entry[key] as string).trim() : ""))
          .filter(Boolean)
          .join(" — ");
      })
      .filter(Boolean)
      .join(" • ");
  }
  return "";
}

/**
 * Optional AI draft for a template's own content slots.
 *
 * A suggestion is never written into the form on its own: the client reads it
 * here, then decides. Prices, features, and plan rules never reach this panel —
 * the server only drafts the fields the template declared.
 */
export function AiDraftPanel({
  slots, fields, content, draft, source, brief, loading, enabled, ready, suggestedBrief,
  onBrief, onRequest, onApply, onDismiss,
}: DraftPanelProps) {
  if (!enabled || slots.length === 0) return null;

  const fieldOf = (id: string) => fields.find((field) => field.id === id);
  // The box starts filled from the form, but the moment the client types, theirs wins.
  const effectiveBrief = brief.trim() ? brief : suggestedBrief ?? "";
  const canRequest = effectiveBrief.trim().length >= 3 && ready && !loading;
  const changed = draft
    ? Object.entries(draft).filter(([id, value]) => preview(value) !== preview(content[id]))
    : [];

  return (
    <section aria-label="Draft konten" className="mb-5 rounded-3xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sand text-navy"><Sparkles className="size-4" /></span>
          <h3 className="text-base font-extrabold">Draft konten</h3>
        </div>
        <span className="text-xs font-bold text-mute">{slots.length} isian terbuka</span>
      </div>

      {!draft ? (
        <>
          <p className="mt-3 text-sm leading-6 text-mute">
            Usulan akan muncul di sini untuk kamu periksa dulu sebelum masuk ke form.
            {suggestedBrief && !brief.trim()
              ? " Ringkasan di bawah disusun dari isian yang sudah kamu isi — ubah sesukanya."
              : " Tulis ringkas tentang usahamu."}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block grow">
              <span className="text-sm font-bold">Singkatkan usahamu</span>
              <textarea
                value={effectiveBrief}
                onChange={(e) => onBrief(e.target.value)}
                placeholder="Contoh: warung sarapan rumahan dekat kampus, buka jam 6 pagi, menu andalan nasi uduk dan kopi susu."
                rows={3}
                className="mt-2 w-full rounded-2xl border border-[var(--color-input)] bg-white px-4 py-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
              />
            </label>
            <p className="mt-2 text-xs text-mute">
              {!ready ? "Isi nama usaha dulu untuk membuat draft." : "Draft ini hanya mengusulkan isi teks dan produk; tidak menyentuh harga atau pilihan paket."}
            </p>
            <Button variant="outline" disabled={!canRequest} onClick={onRequest} className="shrink-0">
              {loading ? <><Loader2 className="animate-spin" /> Menyusun…</> : <><Wand2 /> Buat draft</>}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-mute">
            {source === "ai"
              ? "Usulan berikut masih mentah. Baca dulu — yang kamu setujui baru masuk ke form, sisanya tetap milik kamu."
              : "AI sedang tidak tersedia, jadi usulan diambil dari ringkasan yang kamu tulis. Tetap periksa sebelum dipakai."}
          </p>

          {changed.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-paper p-4 text-sm leading-6 text-mute">
              Belum ada perbedaan dengan isian saat ini. Tulis brief yang lebih rinci, lalu buat draft lagi.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {changed.map(([id, value]) => {
                const field = fieldOf(id);
                const before = preview(content[id]);
                return (
                  <li key={id} className="rounded-2xl border border-[var(--color-border)] bg-paper p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-coral">{field?.label ?? id}</p>
                    {before && <p className="mt-2 text-sm leading-6 text-mute line-through decoration-mute/40">{before}</p>}
                    <p className="mt-1 text-sm leading-6 text-navy">{preview(value)}</p>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button disabled={loading || changed.length === 0} onClick={onApply}>Pakai draft ini</Button>
            <Button variant="outline" onClick={onDismiss}><Undo2 /> Buang</Button>
            <Button variant="ghost" disabled={loading} onClick={onRequest}>Buat ulang</Button>
          </div>
        </>
      )}
    </section>
  );
}
