import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

/** GET /api/admin/stations — lista todas las estaciones (vista admin). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const stations = await prisma.station.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      franchise: true,
      accentColor: true,
      motif: true,
      featured: true,
      _count: { select: { tracks: true } },
    },
  });

  return NextResponse.json({ stations });
}

/** POST /api/admin/stations — crea una nueva estación. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-stations-create:${ip}`, 20, 60);
  if (!rl.success) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.name || !body?.franchise || !body?.accentColor) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const station = await prisma.station.create({
    data: {
      slug: body.slug,
      name: body.name,
      nameEn: body.nameEn || null,
      franchise: body.franchise,
      logoUrl: body.logoUrl ?? "",
      accentColor: body.accentColor,
      motif: body.motif ?? "bars",
      featured: !!body.featured,
    },
  });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "STATION_CREATE",
    entity: station.id,
    detail: { slug: station.slug, name: station.name },
    ip,
  });

  return NextResponse.json({ station });
}
