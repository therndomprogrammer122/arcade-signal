/**
 * Rate limiting por IP.
 *
 * En producción (Vercel, serverless multi-instancia) usa Upstash Redis
 * si UPSTASH_REDIS_REST_URL / TOKEN están configuradas. En local, cae a un
 * store en memoria (suficiente para desarrollo, NO usar en prod multi-instancia).
 */

type Bucket = { count: number; resetAt: number };
const memoryStore = new Map<string, Bucket>();

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstashLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const pipeline = [
    ["INCR", key],
    ["EXPIRE", key, String(windowSec), "NX"],
  ];
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(pipeline),
  });
  const data = await res.json();
  const count = Number(data?.[0]?.result ?? 1);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + windowSec * 1000,
  };
}

function memoryLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true, remaining: limit - 1, resetAt: now + windowSec * 1000 };
  }
  existing.count += 1;
  return {
    success: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * @param identifier normalmente `${scope}:${ip}`
 * @param limit número máximo de requests
 * @param windowSec ventana en segundos
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  if (hasUpstash) return upstashLimit(identifier, limit, windowSec);
  return memoryLimit(identifier, limit, windowSec);
}

/** Extrae la IP real detrás de proxies (Vercel setea x-forwarded-for). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
