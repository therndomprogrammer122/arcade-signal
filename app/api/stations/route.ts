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

  // El frontend manda su idioma actual (el que eligió con el selector ES/EN,
  // no necesariamente el del navegador) para que el nombre devuelto coincida.
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "es";

  // Solo se exponen los campos necesarios para pintar el grid — nunca la
  // lista de tracks ni sus IDs de YouTube.
  const stations = await prismaPublic.station.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      franchise: true,
      logoUrl: true,
      accentColor: true,
      motif: true,
      featured: true,
    },
  });

  // Si la estación no tiene nombre en inglés cargado, cae de vuelta al
  // nombre en español — así nunca se muestra vacío mientras vas traduciendo
  // el catálogo de a poco.
  const localized = stations.map(({ nameEn, ...s }) => ({
    ...s,
    name: locale === "en" && nameEn ? nameEn : s.name,
  }));

  const res = NextResponse.json({ stations: localized });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res;
}
