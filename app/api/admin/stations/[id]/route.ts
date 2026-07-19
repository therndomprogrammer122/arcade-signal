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

const logoUrlSchema = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || /^\/uploads\/logos\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif)$/.test(v),
    "Debe ser una URL válida o una imagen subida desde el panel"
  );

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  franchise: z.string().min(1).max(100).optional(),
  logoUrl: logoUrlSchema.optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un hex de 6 dígitos, ej. #3E5C4A")
    .optional(),
  featured: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const station = await prisma.station.findUnique({ where: { id: params.id } });
  if (!station) return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 });
  return NextResponse.json({ station });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-write:${ip}`, 30, 60);
  if (!rl.success) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data };
  if (data.name) data.name = sanitizeText(data.name, 100);
  if (data.franchise) data.franchise = sanitizeText(data.franchise, 100);

  const station = await prisma.station.update({ where: { id: params.id }, data });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "STATION_UPDATE",
    entity: `Station:${station.id}`,
    detail: data,
    ip,
  });

  return NextResponse.json({ station });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-write:${ip}`, 10, 60);
  if (!rl.success) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const station = await prisma.station.findUnique({
    where: { id: params.id },
    include: { _count: { select: { tracks: true } } },
  });
  if (!station) return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 });

  // El esquema tiene onDelete: Cascade en Track → Station, así que esto
  // borra la estación y todos sus tracks en una sola operación atómica.
  await prisma.station.delete({ where: { id: params.id } });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "STATION_DELETE",
    entity: `Station:${params.id}`,
    detail: { name: station.name, tracksDeleted: station._count.tracks },
    ip,
  });

  return NextResponse.json({ deleted: true });
}