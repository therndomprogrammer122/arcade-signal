import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCsrfToken, CSRF_HEADER } from "@/lib/csrf";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const suggestion = await prisma.suggestion.update({
    where: { id: params.id },
    data: { reviewed: true },
  });
  return NextResponse.json({ suggestion });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  await prisma.suggestion.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}