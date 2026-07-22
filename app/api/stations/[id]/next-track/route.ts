import { NextResponse } from "next/server";
import { prismaPublic } from "@/lib/prismaPublic";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() });
// "exclude" ahora acepta un historial de varios IDs separados por coma
// (los últimos tracks reproducidos), no solo el anterior.
const querySchema = z.object({ exclude: z.string().optional() });

// Tope de historial que aceptamos del cliente, por las dudas.
const MAX_HISTORY = 50;

/**
 * Devuelve UN track aleatorio para la estación pedida, evitando repetir
 * cualquiera de los últimos reproducidos (historial), no solo el anterior.
 * El tamaño de historial que realmente se aplica se ajusta al tamaño del
 * catálogo de la estación, así nunca se queda sin candidatos —funciona
 * igual de bien para una estación de 60 tracks que para una de 1700, y para
 * cualquier estación nueva que se cree en el futuro sin tocar código.
 *
 * El cliente nunca ve el catálogo completo de tracks/IDs de YouTube — solo
 * el que le toca reproducir en este momento, bajo demanda.
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
  const locale = url.searchParams.get("locale") === "en" ? "en" : "es";
  const parsedQuery = querySchema.safeParse({
    exclude: url.searchParams.get("exclude") ?? undefined,
  });
  const rawExclude = parsedQuery.success ? parsedQuery.data.exclude : undefined;

  // El cliente manda el historial ordenado del más reciente al más viejo.
  // Filtramos cualquier valor que no sea un cuid válido (defensivo) y
  // recortamos al tope permitido.
  const cuid = z.string().cuid();
  const historyIds = (rawExclude ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => cuid.safeParse(s).success)
    .slice(0, MAX_HISTORY);

  const stationId = parsedParams.data.id;

  const station = await prismaPublic.station.findUnique({
    where: { id: stationId },
    select: { id: true, name: true, nameEn: true },
  });
  if (!station) {
    return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 });
  }
  const stationName = locale === "en" && station.nameEn ? station.nameEn : station.name;

  const baseWhere = { stationId, active: true };
  const totalActive = await prismaPublic.track.count({ where: baseWhere });
  if (totalActive === 0) {
    return NextResponse.json({ error: "Estación sin tracks disponibles" }, { status: 404 });
  }

  // Nunca excluimos más de (totalActive - 1): siempre debe quedar al menos
  // 1 candidato. Tomamos los más recientes del historial hasta ese tope,
  // así en estaciones chicas se aplica un historial corto y en estaciones
  // grandes uno más largo, de forma proporcional y automática.
  const maxExclude = Math.max(0, totalActive - 1);
  const appliedExclude = historyIds.slice(0, maxExclude);

  const where = {
    ...baseWhere,
    ...(appliedExclude.length ? { NOT: { id: { in: appliedExclude } } } : {}),
  };

  const count = await prismaPublic.track.count({ where });
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
    station: { id: station.id, name: stationName },
    track,
  });
}
