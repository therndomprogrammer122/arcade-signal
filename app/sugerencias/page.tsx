"use client";

import { useState } from "react";
import Link from "next/link";

type SubmissionType = "estacion" | "feedback";

export default function SuggestionsPage() {
  const [type, setType] = useState<SubmissionType>("estacion");
  const [franchise, setFranchise] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isValid = type === "estacion" ? !!franchise.trim() : !!notes.trim();
    if (!isValid) return;

    setStatus("sending");
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        franchise: type === "estacion" ? franchise.trim() : undefined,
        notes: notes.trim() || undefined,
        website,
      }),
    });
    if (res.ok) {
      setStatus("sent");
      setFranchise("");
      setNotes("");
    } else {
      setStatus("error");
    }
  }

  function switchType(next: SubmissionType) {
    setType(next);
    setStatus("idle");
  }

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-2">
        Frecuencia pirata
      </p>
      <h1 className="font-serif tracking-tightest text-4xl sm:text-5xl mb-4 text-ink">
        {type === "estacion" ? "Sugiere una estación" : "Danos tu feedback"}
      </h1>
      <p className="font-sans text-base text-ink/55 mb-6 max-w-md">
        {type === "estacion"
          ? "¿Qué franquicia o banda sonora te gustaría escuchar acá? Mandanos la idea, no garantizamos que se agregue, pero las leemos todas."
          : "¿Algo que no funciona, una idea, o simplemente qué te pareció el sitio? Te leemos."}
      </p>

      {/* Selector de tipo — pestañas simples */}
      <div className="flex gap-2 mb-8 font-mono text-[10px] tracking-widemono uppercase">
        <button
          type="button"
          onClick={() => switchType("estacion")}
          className={`border px-3 py-2 transition-colors duration-instant ease-enter ${
            type === "estacion" ? "border-ink bg-ink text-void" : "border-wire text-ink/50 hover:text-ink"
          }`}
        >
          Sugerir estación
        </button>
        <button
          type="button"
          onClick={() => switchType("feedback")}
          className={`border px-3 py-2 transition-colors duration-instant ease-enter ${
            type === "feedback" ? "border-ink bg-ink text-void" : "border-wire text-ink/50 hover:text-ink"
          }`}
        >
          Feedback del sitio
        </button>
      </div>

      {status === "sent" ? (
        <p className="font-sans text-sm text-ink border border-wire p-4">
          Gracias, la recibimos. 📻
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {type === "estacion" && (
            <div>
              <label className="font-mono text-[10px] tracking-widemono uppercase text-ink/50 block mb-1">
                Franquicia o juego *
              </label>
              <input
                value={franchise}
                onChange={(e) => setFranchise(e.target.value)}
                placeholder="ej. Chrono Trigger"
                required
                maxLength={100}
                className="w-full border border-wire bg-transparent px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ink"
              />
            </div>
          )}

          <div>
            <label className="font-mono text-[10px] tracking-widemono uppercase text-ink/50 block mb-1">
              {type === "estacion" ? "Notas (opcional)" : "Tu feedback *"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === "estacion"
                  ? "Algo puntual que quieras aclarar…"
                  : "Contanos qué te gustó, qué no, o qué le agregarías…"
              }
              required={type === "feedback"}
              maxLength={500}
              rows={4}
              className="w-full border border-wire bg-transparent px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ink resize-none"
            />
          </div>

          {/* Honeypot — invisible para humanos, los bots suelen llenar todos los campos */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {status === "error" && (
            <p className="text-sm text-red-400">Algo salió mal. Probá de nuevo en un momento.</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="border border-ink py-2.5 font-mono text-[11px] tracking-widemono uppercase text-ink transition-colors duration-instant ease-enter hover:bg-ink hover:text-void disabled:opacity-40"
          >
            {status === "sending" ? "Enviando…" : "Enviar"}
          </button>
        </form>
      )}

      <Link
        href="/"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 text-ink/50 inline-block mt-10"
      >
        ← Volver a la radio
      </Link>
    </main>
  );
}