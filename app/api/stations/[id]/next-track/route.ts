import { NextResponse } from "next/server";
import { prismaPublic } from "@/lib/prismaPublic";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() });
const querySchema = z.object({ exclude: z.string().cuid().optional() });

/**
 * Devuelve UN track aleatorio (no repite el anterior si es posible) para la
 * estación pedida. El cliente nunca ve el catálogo completo de tracks/IDs de
 * YouTube — solo el que le toca reproducir en este momento, bajo demanda.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`next-track:${ip}`, 90, 60); // 90 req/min por IP
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Estación inválida" }, { status: 400 });
  }

  const url = new URL(req.url);
  const parsedQuery = querySchema.safeParse({
    exclude: url.searchParams.get("exclude") ?? undefined,
  });
  const exclude = parsedQuery.success ? parsedQuery.data.exclude : undefined;

  const stationId = parsedParams.data.id;

  const station = await prismaPublic.station.findUnique({
    where: { id: stationId },
    select: { id: true, name: true },
  });
  if (!station) {
    return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 });
  }

  const where = {
    stationId,
    active: true,
    ...(exclude ? { NOT: { id: exclude } } : {}),
  };

  const count = await prismaPublic.track.count({ where });
  if (count === 0) {
    return NextResponse.json({ error: "Estación sin tracks disponibles" }, { status: 404 });
  }

  const skip = Math.floor(Math.random() * count);
  const track = await prismaPublic.track.findFirst({
    where,
    skip,
    select: {
      id: true,
      youtubeId: true,
      title: true,
      channelTitle: true,
      durationSec: true,
    },
  });

  return NextResponse.json({
    station: { id: station.id, name: station.name },
    track,
  });
}
