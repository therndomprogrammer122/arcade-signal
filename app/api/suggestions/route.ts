import { NextResponse } from "next/server";
import { prismaSuggest } from "@/lib/prismaSuggest";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z
  .object({
    type: z.enum(["estacion", "feedback"]),
    franchise: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
    website: z.string().max(0).optional(), // honeypot — un humano nunca llena esto
  })
  .refine(
    (data) =>
      data.type === "feedback"
        ? !!data.notes && data.notes.trim().length >= 2
        : !!data.franchise && data.franchise.trim().length >= 2,
    { message: "Falta el campo requerido para este tipo de envío." }
  );

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Límite estricto: es un formulario público, el blanco más probable de spam.
  const rl = await rateLimit(`suggestion:${ip}`, 5, 60 * 60); // 5 por hora por IP
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas sugerencias. Probá de nuevo más tarde." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Honeypot: si viene con contenido, es un bot. Respondemos "éxito" para no
  // darle pistas al bot de que fue detectado, pero no guardamos nada.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  await prismaSuggest.suggestion.create({
    data: {
      type: parsed.data.type,
      franchise:
        parsed.data.type === "estacion" && parsed.data.franchise
          ? sanitizeText(parsed.data.franchise, 100)
          : null,
      notes: parsed.data.notes ? sanitizeText(parsed.data.notes, 500) : null,
      ip,
    },
  });

  return NextResponse.json({ ok: true });
}