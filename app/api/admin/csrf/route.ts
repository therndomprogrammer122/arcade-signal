import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueCsrfToken } from "@/lib/csrf";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const token = issueCsrfToken();
  return NextResponse.json({ csrfToken: token });
}
