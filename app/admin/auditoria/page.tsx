"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LogRow {
  id: string;
  action: string;
  entity: string | null;
  detail: string | null;
  ip: string | null;
  createdAt: string;
  admin: { email: string };
}
function summarizeDetail(action: string, detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    if (action === "TRACK_BULK_CREATE" && typeof parsed.count === "number") {
      return `${parsed.count} tracks agregados`;
    }
    if (action === "TRACK_BULK_DELETE" && typeof parsed.count === "number") {
      return `${parsed.count} tracks eliminados`;
    }
    if (action === "STATION_UPDATE") {
      const fields = Object.keys(parsed).join(", ");
      return `Campos modificados: ${fields}`;
    }
    return null; // sin resumen especial, se muestra el detalle completo tal cual
  } catch {
    return null;
  }
}
function LogDetail({ action, detail }: { action: string; detail: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const summary = summarizeDetail(action, detail);

  if (!detail) return null;

  // Si no hay resumen especial para esta acción, mostramos el detalle completo directo
  if (!summary) {
    return <p className="font-mono text-[10px] text-carbon/40 mt-1 break-all">{detail}</p>;
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="font-mono text-[10px] text-carbon/50 underline underline-offset-4"
      >
        {summary} {expanded ? "· ocultar detalle" : "· ver detalle"}
      </button>
      {expanded && (
        <p className="font-mono text-[10px] text-carbon/40 mt-1 break-all">{detail}</p>
      )}
    </div>
  );
}
export default function AuditPage() {
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/audit?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      });
  }, [page]);

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <Link
        href="/admin"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 text-carbon/50 inline-block mb-4"
      >
        ← Volver al panel
      </Link>
      <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-2">
        Panel
      </p>
      <h1 className="font-serif tracking-tightest text-4xl mb-8">Auditoría</h1>

      <div className="hairline mb-8" />

      {logs === null && <p className="font-sans text-sm text-carbon/50">Cargando…</p>}

      <ul className="divide-y divide-carbon/10">
        {logs?.map((log) => (
          <li key={log.id} className="py-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-carbon/50">
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              <span>{log.ip ?? "—"}</span>
            </div>
            <p className="font-sans text-sm mt-1">
              <span className="font-medium">{log.action}</span>
              {log.entity ? ` · ${log.entity}` : ""} · {log.admin.email}
            </p>
            <LogDetail action={log.action} detail={log.detail} />
          </li>
        ))}
      </ul>

      {logs?.length === 0 && (
        <p className="font-sans text-sm text-carbon/50">Sin actividad registrada todavía.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-4 mt-6 font-mono text-[10px] tracking-widemono uppercase">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}