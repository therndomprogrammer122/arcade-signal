"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCsrfToken } from "@/components/useCsrfToken";
import { CSRF_HEADER } from "@/lib/csrf-constants";

interface MessageRow {
  id: string;
  message: string;
  replyTo: string | null;
  reviewed: boolean;
  createdAt: string;
}

export default function MessagesAdminPage() {
  const csrfToken = useCsrfToken();
  const [messages, setMessages] = useState<MessageRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/messages");
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markReviewed(id: string) {
    if (!csrfToken) return;
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { [CSRF_HEADER]: csrfToken },
    });
    void load();
  }

  async function remove(id: string) {
    if (!csrfToken) return;
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    await fetch(`/api/admin/messages/${id}`, {
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
      <h1 className="font-serif tracking-tightest text-4xl mb-8">Mensajes</h1>

      <div className="hairline mb-8" />

      <ul className="divide-y divide-carbon/10">
        {messages?.map((m) => (
          <li key={m.id} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-sans text-sm text-carbon/90 whitespace-pre-wrap">
                  {m.message}
                </p>
                {m.replyTo && (
                  <p className="font-mono text-[11px] text-carbon/60 mt-2">
                    Responder a: {m.replyTo}
                  </p>
                )}
                <p className="font-mono text-[10px] text-carbon/40 mt-1">
                  {new Date(m.createdAt).toLocaleString()}
                  {m.reviewed && <span> · revisado</span>}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {!m.reviewed && (
                  <button
                    onClick={() => markReviewed(m.id)}
                    className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4"
                  >
                    Marcar revisado
                  </button>
                )}
                <button
                  onClick={() => remove(m.id)}
                  className="font-mono text-[10px] tracking-widemono uppercase text-red-700 underline underline-offset-4"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {messages?.length === 0 && (
        <p className="font-sans text-sm text-carbon/50">Sin mensajes todavía.</p>
      )}
    </main>
  );
}
