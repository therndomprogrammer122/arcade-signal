"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useCsrfToken } from "@/components/useCsrfToken";
import { CSRF_HEADER } from "@/lib/csrf-constants";

interface StationRow {
  id: string;
  slug: string;
  name: string;
  franchise: string;
  accentColor: string;
  featured: boolean;
  _count: { tracks: number };
}

export default function AdminDashboard() {
  const csrfToken = useCsrfToken();
  const [stations, setStations] = useState<StationRow[] | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    franchise: "",
    logoUrl: "",
    accentColor: "#3E5C4A",
    featured: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadStations() {
    const res = await fetch("/api/admin/stations");
    const data = await res.json();
    setStations(data.stations ?? []);
  }

  useEffect(() => {
    void loadStations();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!csrfToken) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Error al crear la estación");
      return;
    }
    setForm({ slug: "", name: "", franchise: "", logoUrl: "", accentColor: "#3E5C4A", featured: false });
    void loadStations();
  }

  return (
    <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-2">
            Panel
          </p>
          <h1 className="font-serif tracking-tightest text-4xl">Estaciones</h1>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4"
        >
          Cerrar sesión
        </button>
      </div>
      <Link
        href="/admin/auditoria"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 mr-6"
      >
        Auditoría
      </Link>
      <div className="hairline mb-8" />
      <Link
  href="/admin/sugerencias"
  className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 mr-6"
>
  Sugerencias
</Link>

      <section className="mb-12">
        {stations === null && <p className="font-sans text-sm text-carbon/50">Cargando…</p>}
        <ul className="divide-y divide-carbon/10">
          {stations?.map((s, i) => (
            <li key={s.id} className="flex items-center gap-4 py-3">
              <span className="font-mono text-[11px] text-carbon/40 w-8">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="w-3 h-3 shrink-0" style={{ backgroundColor: s.accentColor }} />
              <Link href={`/admin/estaciones/${s.id}`} className="font-sans text-sm font-medium flex-1 hover:underline">
                {s.name}
              </Link>
              <span className="font-mono text-[10px] text-carbon/40">{s._count.tracks} tracks</span>
            </li>
          ))}
        </ul>
        {stations?.length === 0 && (
          <p className="font-sans text-sm text-carbon/50">Todavía no hay estaciones.</p>
        )}
      </section>

      <div className="hairline mb-8" />

      <section>
        <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-4">
          Nueva estación
        </p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            placeholder="slug (ej. hyrule)"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
          />
          <input
            placeholder="Nombre (ej. Estación Hyrule)"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
          />
          <input
            placeholder="Franquicia (ej. The Legend of Zelda)"
            required
            value={form.franchise}
            onChange={(e) => setForm({ ...form, franchise: e.target.value })}
            className="border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
          />
          <input
            placeholder="URL del logo"
            required
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            className="border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="w-10 h-10 border border-carbon/20"
            />
            <span className="font-mono text-xs">{form.accentColor}</span>
          </div>
          <label className="flex items-center gap-2 font-sans text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Destacada (portada)
          </label>

          {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={saving || !csrfToken}
            className="sm:col-span-2 border border-carbon py-2.5 font-mono text-[11px] tracking-widemono uppercase transition-colors duration-instant ease-enter hover:bg-carbon hover:text-bone disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Crear estación"}
          </button>
        </form>
      </section>
    </main>
  );
}
