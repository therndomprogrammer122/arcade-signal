"use client";

import { useState } from "react";

export default function ContactForm() {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim(), replyTo: replyTo.trim(), website }),
    });
    if (res.ok) {
      setStatus("sent");
      setMessage("");
      setReplyTo("");
    } else {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="font-sans text-sm text-ink border border-wire p-4">
        Mensaje recibido. Lo revisamos a la brevedad.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Contanos qué contenido querés que retiremos, o tu consulta…"
        required
        maxLength={1000}
        rows={4}
        className="w-full border border-wire bg-transparent px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ink resize-none"
      />
      <input
        type="email"
        value={replyTo}
        onChange={(e) => setReplyTo(e.target.value)}
        placeholder="Tu email, si querés que te respondamos (opcional)"
        className="w-full border border-wire bg-transparent px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-ink"
      />
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
        <p className="text-sm text-red-400">Algo salió mal. Probá de nuevo.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="border border-ink py-2.5 font-mono text-[11px] tracking-widemono uppercase text-ink transition-colors duration-instant ease-enter hover:bg-ink hover:text-void disabled:opacity-40 self-start px-6"
      >
        {status === "sending" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}