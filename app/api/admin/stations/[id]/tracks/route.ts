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

const bodySchema = z.object({
  youtubeId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/, "ID de YouTube inválido"),
  title: z.string().min(1).max(300),
  channelTitle: z.string().max(200).optional(),
  durationSec: z
  .number()
  .int()
  .gt(10, "La canción debe durar más de 10 segundos")
  .max(60 * 60 * 6)
  .optional(),
  thumbnailUrl: z.string().url().optional(),
});

/** POST /api/admin/stations/[id]/tracks — agrega un track a una estación. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-write:${ip}`, 30, 60);
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const station = await prisma.station.findUnique({ where: { id: params.id } });
  if (!station) return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 });

  const data = parsed.data;
  const track = await prisma.track.create({
    data: {
      stationId: station.id,
      youtubeId: data.youtubeId,
      title: sanitizeText(data.title, 300),
      channelTitle: data.channelTitle ? sanitizeText(data.channelTitle, 200) : null,
      durationSec: data.durationSec,
      thumbnailUrl: data.thumbnailUrl,
    },
  });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "TRACK_CREATE",
    entity: `Track:${track.id}`,
    detail: { stationId: station.id, youtubeId: track.youtubeId, title: track.title },
    ip,
  });

  return NextResponse.json({ track }, { status: 201 });
}

/** GET /api/admin/stations/[id]/tracks — lista tracks de una estación (vista admin). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tracks = await prisma.track.findMany({
    where: { stationId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tracks });
}

const deleteSchema = z.object({ trackId: z.string().cuid() });

/** DELETE /api/admin/stations/[id]/tracks — elimina (o desactiva) un track. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-write:${ip}`, 30, 60);
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "trackId inválido" }, { status: 400 });

  const track = await prisma.track.delete({
    where: { id: parsed.data.trackId, stationId: params.id },
  });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "TRACK_DELETE",
    entity: `Track:${track.id}`,
    detail: { title: track.title },
    ip,
  });

  return NextResponse.json({ success: true });
}
