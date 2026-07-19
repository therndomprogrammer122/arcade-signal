import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({ playlist: z.string().min(5).max(300) });

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

// Acepta tanto un playlistId puro como una URL completa de YouTube
function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("http")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("list");
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = getClientIp(req);
  const rl = await rateLimit(`yt-playlist:${ip}`, 15, 60);
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiadas solicitudes, espera un poco" }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ playlist: url.searchParams.get("playlist") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "Playlist inválida" }, { status: 400 });

  const playlistId = extractPlaylistId(parsed.data.playlist);
  if (!playlistId) return NextResponse.json({ error: "No se reconoce el ID de playlist" }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "YOUTUBE_API_KEY no configurada" }, { status: 500 });

  try {
    // 1) Paginar playlistItems (máx 50 por página, tope de 200 videos en total)
    let items: { videoId: string; title: string; channelTitle: string; thumbnailUrl: string }[] = [];
    let pageToken: string | undefined;

    do {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}` +
          (pageToken ? `&pageToken=${pageToken}` : "") +
          `&key=${apiKey}`
      );
      if (!res.ok) throw new Error(`playlistItems ${res.status}`);
      const data = await res.json();

      items.push(
        ...(data.items ?? [])
          .filter((i: any) => i.snippet?.resourceId?.videoId)
          .map((i: any) => ({
            videoId: i.snippet.resourceId.videoId,
            title: i.snippet.title,
            channelTitle: i.snippet.videoOwnerChannelTitle ?? i.snippet.channelTitle ?? "",
            thumbnailUrl: i.snippet.thumbnails?.medium?.url ?? "",
          }))
      );
      pageToken = data.nextPageToken;
    } while (pageToken && items.length < 200);

    if (items.length === 0) return NextResponse.json({ results: [] });

    // 2) Duraciones en lotes de 50 (límite de la API videos.list)
    const results: any[] = [];
    for (let i = 0; i < items.length; i += 50) {
      const batch = items.slice(i, i + 50);
      const ids = batch.map((b) => b.videoId).join(",");
      const detRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`
      );
      if (!detRes.ok) throw new Error(`videos ${detRes.status}`);
      const detData = await detRes.json();
      const durationById = new Map<string, number>(
      (detData.items ?? []).map((v: any) => [v.id, parseDuration(v.contentDetails.duration)] as [string, number])
      );
      results.push(
        ...batch.map((b) => ({
          youtubeId: b.videoId,
          title: b.title,
          channelTitle: b.channelTitle || "Desconocido",
          thumbnailUrl: b.thumbnailUrl || "",
          durationSec: durationById.get(b.videoId) ?? 0,
        }))
        .filter((t) => t.durationSec > 10)
      );
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[youtube/playlist]", err);
    return NextResponse.json({ error: "Error consultando la playlist" }, { status: 502 });
  }
}