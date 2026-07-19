import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({ q: z.string().min(2).max(100) });

// Parsea duración ISO 8601 (PT4M13S) a segundos
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export async function GET(req: Request) {
  // El middleware ya exige sesión para /api/admin/**, pero re-validamos aquí
  // como defensa en profundidad (esta ruta llama a una API externa de pago).
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getClientIp(req);
  // Rate limit conservador: cuida la cuota diaria de YouTube Data API.
  const rl = await rateLimit(`yt-search:${ip}`, 20, 60);
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas búsquedas, espera un poco" }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Búsqueda inválida" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY no configurada" }, { status: 500 });
  }

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(
        parsed.data.q
      )}&key=${apiKey}`
    );
    if (!searchRes.ok) throw new Error(`YouTube search ${searchRes.status}`);
    const searchData = await searchRes.json();

    const ids = (searchData.items ?? [])
      .map((item: { id: { videoId: string } }) => item.id.videoId)
      .filter(Boolean)
      .join(",");

    if (!ids) return NextResponse.json({ results: [] });

    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ids}&key=${apiKey}`
    );
    if (!detailsRes.ok) throw new Error(`YouTube videos ${detailsRes.status}`);
    const detailsData = await detailsRes.json();

    const results = (detailsData.items ?? [])
    .map(
    (item: {
      id: string;
      snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string } } };
      contentDetails: { duration: string };
    }) => ({
      youtubeId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
      durationSec: parseDuration(item.contentDetails.duration),
    })
  )
  .filter((t: { durationSec: number }) => t.durationSec > 10);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[youtube/search]", err);
    return NextResponse.json({ error: "Error consultando YouTube" }, { status: 502 });
  }
}
