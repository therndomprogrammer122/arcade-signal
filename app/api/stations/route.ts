import { NextResponse } from "next/server";
import { prismaPublic } from "@/lib/prismaPublic";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`stations:${ip}`, 60, 60); // 60 req/min por IP
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  // Solo se exponen los campos necesarios para pintar el grid — nunca la
  // lista de tracks ni sus IDs de YouTube.
  const stations = await prismaPublic.station.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      franchise: true,
      logoUrl: true,
      accentColor: true,
      motif: true,
      featured: true,
    },
  });

  const res = NextResponse.json({ stations });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res;
}
