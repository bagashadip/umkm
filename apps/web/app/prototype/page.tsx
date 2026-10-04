"use client";

import { useCallback, useEffect, useState } from "react";
import { PrototypeRenderer, type PrototypeConfig } from "@umkm/core-frontend";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function PrototypePage() {
  const [config, setConfig] = useState<PrototypeConfig | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/prototype/sample`);
      if (!response.ok) throw new Error("Sample prototype belum tersedia.");
      setConfig(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tidak bisa memuat prototype.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  if (loading) return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <div className="text-center">
        <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-navy/15">
          <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-coral" />
        </div>
        <p className="mt-4 text-sm font-bold text-mute">Memuat prototype...</p>
      </div>
    </main>
  );
  if (error) return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="max-w-md rounded-[var(--radius)] border border-coral/30 bg-coral/5 p-7">
        <h1 className="display text-3xl text-navy">Prototype belum tampil</h1>
        <p className="mt-3 text-mute">{error}</p>
        <Button type="button" onClick={() => void load()} className="mt-6">Coba lagi</Button>
      </section>
    </main>
  );
  if (!config) return null;
  return <PrototypeRenderer config={config} />;
}
