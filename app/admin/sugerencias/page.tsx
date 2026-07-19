"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCsrfToken } from "@/components/useCsrfToken";
import { CSRF_HEADER } from "@/lib/csrf-constants";

interface SuggestionRow {
  id: string;
  franchise: string;
  notes: string | null;
  reviewed: boolean;
  createdAt: string;
}

export default function SuggestionsAdminPage() {
  const csrfToken = useCsrfToken();
  const [suggestions, setSuggestions] = useState<SuggestionRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/suggestions");
    const data = await res.json();
    setSuggestions(data.suggestions ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markReviewed(id: string) {
    if (!csrfToken) return;
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { [CSRF_HEADER]: csrfToken },
    });
    void load();
  }

  async function remove(id: string) {
    if (!csrfToken) return;
    if (!window.confirm("¿Eliminar esta sugerencia?")) return;
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "DELETE",
      headers: { [CSRF_HEADER]: csrfToken },
    });
    void load();
  }

  return (
    <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <Link
        href="/admin"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 text-carbon/50 inline-block mb-4"
      >
        ← Volver al panel
      </Link>
      <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-2">Panel</p>
      <h1 className="font-serif tracking-tightest text-4xl mb-8">Sugerencias</h1>

      <div className="hairline mb-8" />

      <ul className="divide-y divide-carbon/10">
        {suggestions?.map((s) => (
          <li key={s.id} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium">
                  {s.franchise} {s.reviewed && <span className="text-carbon/40">· revisada</span>}
                </p>
                {s.notes && <p className="font-sans text-sm text-carbon/60 mt-1">{s.notes}</p>}
                <p className="font-mono text-[10px] text-carbon/40 mt-1">
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {!s.reviewed && (
                  <button
                    onClick={() => markReviewed(s.id)}
                    className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4"
                  >
                    Marcar revisada
                  </button>
                )}
                <button
                  onClick={() => remove(s.id)}
                  className="font-mono text-[10px] tracking-widemono uppercase text-red-700 underline underline-offset-4"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {suggestions?.length === 0 && (
        <p className="font-sans text-sm text-carbon/50">Sin sugerencias todavía.</p>
      )}
    </main>
  );
}