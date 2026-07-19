import { NextResponse } from "next/server";
import { prismaSuggest } from "@/lib/prismaSuggest";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().min(5).max(1000),
  replyTo: z.string().email().max(200).optional().or(z.literal("")),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`contact:${ip}`, 3, 60 * 60); // 3 por hora por IP
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiados mensajes. Probá más tarde." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true }); // honeypot: fingimos éxito, no guardamos
  }

  await prismaSuggest.contactMessage.create({
    data: {
      message: sanitizeText(parsed.data.message, 1000),
      replyTo: parsed.data.replyTo || null,
      ip,
    },
  });

  return NextResponse.json({ ok: true });
}