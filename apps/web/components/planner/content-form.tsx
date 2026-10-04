"use client";

import { Plus, Trash2 } from "lucide-react";

type Field = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
  maxItems?: number;
  group?: string;
  options?: Array<{ value: string; label: string }>;
};

type Props = {
  fields: Field[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
};

type Product = { name: string; description: string; price: string };
type GalleryItem = { src: string; alt: string; caption?: string };
type CollectionItem = { quote: string; name: string; role?: string };
type Fact = { label: string; value: string };
type Feature = { title: string; body: string };

const isListType = (type: string) =>
  type === "productList" || type === "imageList" || type === "collectionList" || type === "factList" || type === "featureList";

const listOf = <T,>(value: unknown, empty: T): T[] => (Array.isArray(value) ? (value as T[]) : [empty]);

/**
 * Renders a template's content schema. Each template asks for its own fields,
 * so the configurator form is built from data rather than a fixed set of inputs.
 */
export function ContentForm({ fields, values, onChange }: Props) {
  const groups = fields.reduce<Record<string, Field[]>>((acc, field) => {
    const key = field.group ?? "Isian";
    (acc[key] ??= []).push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-7">
      {Object.entries(groups).map(([group, groupFields]) => (
        <fieldset key={group} className="space-y-4">
          <legend className="label text-coral">{group}</legend>
          {groupFields.map((field) => (
            <FieldControl
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(next) => onChange(field.id, next)}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function FieldControl({ field, value, onChange }: { field: Field; value: unknown; onChange: (next: unknown) => void }) {
  const base =
    "mt-2 w-full rounded-2xl border border-[var(--color-input)] bg-white px-4 py-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/20";

  if (isListType(field.type)) {
    return (
      <ListControl
        field={field}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block">
        <span className="text-sm font-bold">
          {field.label}
          {field.required && <span className="text-coral"> *</span>}
        </span>
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={base}
        />
        {field.help && <span className="mt-1 block text-xs text-mute">{field.help}</span>}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block">
        <span className="text-sm font-bold">
          {field.label}
          {field.required && <span className="text-coral"> *</span>}
        </span>
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">Pilih salah satu</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="text-sm font-bold">
        {field.label}
        {field.required && <span className="text-coral"> *</span>}
      </span>
      <input
        type={field.type === "phone" ? "tel" : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={base}
      />
      {field.help && <span className="mt-1 block text-xs text-mute">{field.help}</span>}
    </label>
  );
}

function ListControl({ field, value, onChange }: { field: Field; value: unknown; onChange: (next: unknown) => void }) {
  const max = field.maxItems ?? 60;

  if (field.type === "productList") {
    const items = listOf<Product>(value, { name: "", description: "", price: "" });
    const patch = (index: number, next: Partial<Product>) =>
      onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
    return (
      <Block label={field.label} required={field.required}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-2xl bg-paper p-3 sm:grid-cols-[1fr_1fr_9rem]">
              <input aria-label={`${field.label} ${index + 1} — nama`} value={item.name} onChange={(e) => patch(index, { name: e.target.value })} placeholder="Nama produk" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
              <input aria-label={`${field.label} ${index + 1} — deskripsi`} value={item.description} onChange={(e) => patch(index, { description: e.target.value })} placeholder="Deskripsi singkat" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
              <input aria-label={`${field.label} ${index + 1} — harga`} value={item.price} onChange={(e) => patch(index, { price: e.target.value })} placeholder="Rp ..." className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
            </div>
          ))}
        </div>
        <AddRemove
          canAdd={items.length < max}
          onAdd={() => onChange([...items, { name: "", description: "", price: "" }])}
          onRemove={(index) => onChange(items.filter((_, i) => i !== index))}
          length={items.length}
        />
      </Block>
    );
  }

  if (field.type === "imageList") {
    const items = listOf<GalleryItem>(value, { src: "", alt: "", caption: "" });
    const patch = (index: number, next: Partial<GalleryItem>) =>
      onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
    return (
      <Block label={field.label} required={field.required}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-2xl bg-paper p-3 sm:grid-cols-[1fr_1fr]">
              <input aria-label={`${field.label} ${index + 1} — alamat gambar`} value={item.src} onChange={(e) => patch(index, { src: e.target.value })} placeholder="https://..." className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
              <input aria-label={`${field.label} ${index + 1} — teks alternatif`} value={item.alt} onChange={(e) => patch(index, { alt: e.target.value })} placeholder="Keterangan gambar" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
            </div>
          ))}
        </div>
        <AddRemove
          canAdd={items.length < max}
          onAdd={() => onChange([...items, { src: "", alt: "", caption: "" }])}
          onRemove={(index) => onChange(items.filter((_, i) => i !== index))}
          length={items.length}
        />
      </Block>
    );
  }

  if (field.type === "collectionList") {
    const items = listOf<CollectionItem>(value, { quote: "", name: "", role: "" });
    const patch = (index: number, next: Partial<CollectionItem>) =>
      onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
    return (
      <Block label={field.label} required={field.required}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-2xl bg-paper p-3">
              <textarea aria-label={`${field.label} ${index + 1} — kutipan`} value={item.quote} onChange={(e) => patch(index, { quote: e.target.value })} placeholder="Apa kata pelangganmu?" rows={2} className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input aria-label={`${field.label} ${index + 1} — nama`} value={item.name} onChange={(e) => patch(index, { name: e.target.value })} placeholder="Nama" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
                <input aria-label={`${field.label} ${index + 1} — peran`} value={item.role} onChange={(e) => patch(index, { role: e.target.value })} placeholder="Peran (opsional)" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
              </div>
            </div>
          ))}
        </div>
        <AddRemove
          canAdd={items.length < max}
          onAdd={() => onChange([...items, { quote: "", name: "", role: "" }])}
          onRemove={(index) => onChange(items.filter((_, i) => i !== index))}
          length={items.length}
        />
      </Block>
    );
  }

  if (field.type === "featureList") {
    const items = listOf<Feature>(value, { title: "", body: "" });
    const patch = (index: number, next: Partial<Feature>) =>
      onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
    return (
      <Block label={field.label} required={field.required}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-2xl bg-paper p-3">
              <input aria-label={`${field.label} ${index + 1} — judul`} value={item.title} onChange={(e) => patch(index, { title: e.target.value })} placeholder="Judul singkat" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
              <textarea aria-label={`${field.label} ${index + 1} — penjelasan`} value={item.body} onChange={(e) => patch(index, { body: e.target.value })} placeholder="Penjelasan singkat" rows={2} className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
            </div>
          ))}
        </div>
        <AddRemove
          canAdd={items.length < max}
          onAdd={() => onChange([...items, { title: "", body: "" }])}
          onRemove={(index) => onChange(items.filter((_, i) => i !== index))}
          length={items.length}
        />
      </Block>
    );
  }

  const items = listOf<Fact>(value, { label: "", value: "" });
  const patch = (index: number, next: Partial<Fact>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));
  return (
    <Block label={field.label} required={field.required}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl bg-paper p-3 sm:grid-cols-2">
            <input aria-label={`${field.label} ${index + 1} — label`} value={item.label} onChange={(e) => patch(index, { label: e.target.value })} placeholder="Label" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
            <input aria-label={`${field.label} ${index + 1} — nilai`} value={item.value} onChange={(e) => patch(index, { value: e.target.value })} placeholder="Isi" className="rounded-xl border border-[var(--color-input)] bg-white px-3 py-2 outline-none focus:border-coral" />
          </div>
        ))}
      </div>
      <AddRemove
        canAdd={items.length < max}
        onAdd={() => onChange([...items, { label: "", value: "" }])}
        onRemove={(index) => onChange(items.filter((_, i) => i !== index))}
        length={items.length}
      />
    </Block>
  );
}

function Block({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-sm font-bold">
        {label}
        {required && <span className="text-coral"> *</span>}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function AddRemove({ canAdd, onAdd, onRemove, length }: { canAdd: boolean; onAdd: () => void; onRemove: (index: number) => void; length: number }) {
  return (
    <div className="mt-3 flex items-center gap-4">
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className="inline-flex items-center gap-1.5 text-sm font-extrabold text-coral disabled:opacity-50"
      >
        <Plus className="size-4" /> Tambah
      </button>
      {length > 1 && (
        <button
          type="button"
          onClick={() => onRemove(length - 1)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-mute hover:text-navy"
        >
          <Trash2 className="size-4" /> Hapus terakhir
        </button>
      )}
    </div>
  );
}
