import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // español (default) sin prefijo, inglés con /en
  // Antes: next-intl detectaba el idioma del navegador (Accept-Language) y
  // te mandaba a /en automaticamente. Lo desactivamos: ahora TODOS entran
  // primero a español, y solo pasan a /en si tocan el selector ES/EN a mano.
  localeDetection: false,
});

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");
  const isApi = pathname.startsWith("/api");

  // Rutas de admin y de API: nunca pasan por next-intl, se comportan igual que antes.
  if (isAdminPage || isApi) {
    const isProtectedAdminPage = isAdminPage && pathname !== "/admin/login";

    if (isProtectedAdminPage || isAdminApi) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName:
          process.env.NODE_ENV === "production"
            ? "__Host-arcade-signal.session-token"
            : "arcade-signal.session-token",
      });

      if (!token) {
        if (isAdminApi) {
          return NextResponse.json({ error: "No autorizado." }, { status: 401 });
        }
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  }

  // Todo lo demás (páginas públicas) pasa por next-intl para detectar/redirigir idioma.
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/api/admin/:path*",
  ],
};