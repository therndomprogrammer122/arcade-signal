import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { writeAuditLog } from "@/lib/audit";
import { verifyCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { z } from "zod";

export const runtime = "nodejs";

const trackSchema = z.object({
  youtubeId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  title: z.string().min(1).max(300),
  channelTitle: z.string().max(200).optional(),
  durationSec: z.number().int().gt(10).max(60 * 60 * 6).optional(),
  thumbnailUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : undefined)),
});
const bodySchema = z.object({ tracks: z.array(trackSchema).min(1).max(500) });

/** POST /api/admin/stations/[id]/tracks/bulk — alta masiva (import de playlist). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-write:${ip}`, 30, 60);
  if (!rl.success) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const station = await prisma.station.findUnique({ where: { id: params.id } });
  if (!station) return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 });

  // Evita duplicados: descarta los que ya existen en esta estación
  const existing = await prisma.track.findMany({
    where: { stationId: station.id, youtubeId: { in: parsed.data.tracks.map((t) => t.youtubeId) } },
    select: { youtubeId: true },
  });
  const existingIds = new Set(existing.map((e) => e.youtubeId));
  const toCreate = parsed.data.tracks.filter((t) => !existingIds.has(t.youtubeId));
  // Deduplicar también DENTRO del propio lote (una playlist puede traer
// el mismo video repetido más de una vez).
const seen = new Set<string>();
const toCreateDeduped = toCreate.filter((t) => {
  if (seen.has(t.youtubeId)) return false;
  seen.add(t.youtubeId);
  return true;
});

  if (toCreate.length === 0) {
    return NextResponse.json({ created: 0, skipped: parsed.data.tracks.length });
  }

  const result = await prisma.track.createMany({
  data: toCreateDeduped.map((t) => ({
    stationId: station.id,
    youtubeId: t.youtubeId,
    title: sanitizeText(t.title, 300),
    channelTitle: t.channelTitle ? sanitizeText(t.channelTitle, 200) : null,
    durationSec: t.durationSec,
    thumbnailUrl: t.thumbnailUrl,
  })),
});

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "TRACK_BULK_CREATE",
    entity: `Station:${station.id}`,
    detail: { count: result.count, youtubeIds: toCreate.map((t) => t.youtubeId) },
    ip,
  });

  return NextResponse.json({ created: result.count, skipped: existingIds.size });
}

const deleteBodySchema = z.object({ trackIds: z.array(z.string().cuid()).min(1).max(500) });

/** DELETE /api/admin/stations/[id]/tracks/bulk — borrado masivo. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-write:${ip}`, 30, 60);
  if (!rl.success) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = deleteBodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "trackIds inválidos" }, { status: 400 });

  const result = await prisma.track.deleteMany({
    where: { id: { in: parsed.data.trackIds }, stationId: params.id },
  });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "TRACK_BULK_DELETE",
    entity: `Station:${params.id}`,
    detail: { count: result.count, trackIds: parsed.data.trackIds },
    ip,
  });

  return NextResponse.json({ deleted: result.count });
}