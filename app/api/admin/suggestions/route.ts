import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const suggestions = await prisma.suggestion.findMany({
    orderBy: [{ reviewed: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ suggestions });
}