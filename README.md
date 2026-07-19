# Arcade Signal

Radio de videojuegos: el usuario elige una estación (franquicia) y escucha una
lista continua de música, sin buscar tracks individuales. Next.js (App
Router) + TypeScript + Tailwind + Prisma/Postgres + NextAuth (2FA) +
YouTube IFrame API para el audio.

## 1. Requisitos

- Node.js 20+
- Una base de datos Postgres (recomendado: [Neon](https://neon.tech) o
  [Supabase](https://supabase.com), ambos tienen plan gratuito)
- Una API key de YouTube Data API v3 ([Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com))

## 2. Instalación

```bash
npm install
cp .env.example .env
```

Completa `.env` con:
- `DATABASE_URL` — cadena de conexión con permisos de escritura (rol admin)
- `DATABASE_URL_PUBLIC` — cadena de conexión con permisos **solo lectura**
- `NEXTAUTH_SECRET` — genera uno con `openssl rand -base64 32`
- `YOUTUBE_API_KEY` — tu API key de YouTube Data API v3
- `APP_ORIGIN` — el dominio donde vivirá la app (para CORS/CSP)

### 2.1 Crear los dos roles de base de datos (importante para la seguridad)

La API pública **nunca** debe poder escribir en la base de datos, ni siquiera
si hay un bug en el código. Por eso usa un rol de Postgres separado, con
`GRANT SELECT` únicamente.

Ejecuta el contenido de `prisma/README-roles.sql` contra tu base de datos
(en Neon/Supabase esto se hace desde su SQL editor), ajustando las
contraseñas. Luego usa esas credenciales en `DATABASE_URL` (rol admin) y
`DATABASE_URL_PUBLIC` (rol solo-lectura) respectivamente.

### 2.2 Crear las tablas y datos de ejemplo

```bash
npm run db:push      # crea las tablas según prisma/schema.prisma
npm run db:seed       # crea 4 estaciones de ejemplo (sin tracks)
```

### 2.3 Crear tu usuario admin (con 2FA)

```bash
npm run admin:create -- --email=tu@correo.com --password=una-contraseña-larga-y-segura
```

Esto imprime en terminal una URL `otpauth://` y un secreto — escanéalo con
Google Authenticator, Authy o 1Password antes de intentar iniciar sesión,
porque el 2FA queda **activado desde el primer login**.

## 3. Correr en desarrollo

```bash
npm run dev
```

- Público: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## 4. Agregar contenido real

1. Entra a `/admin/login` con tu correo, contraseña y código 2FA.
2. Entra a una estación y usa el buscador de YouTube integrado para
   encontrar videos y agregarlos con el botón "Agregar a esta estación".
3. Reemplaza los `logoUrl` de las estaciones de ejemplo (`prisma/seed.ts`)
   por URLs reales de los logos (puedes alojarlos en `/public/logos/` y
   referenciarlos como `/logos/archivo.svg`).

## 5. Seguridad — qué se implementó y por qué

- **Separación de roles de DB**: la API pública usa `DATABASE_URL_PUBLIC`
  (`lib/prismaPublic.ts`), un rol Postgres con `GRANT SELECT` solamente. El
  admin usa `DATABASE_URL` (`lib/prisma.ts`), con lectura/escritura. Esto es
  una barrera a nivel de motor de base de datos, no solo de código.
- **Nunca se expone el catálogo completo de tracks**: `/api/stations/[id]/next-track`
  devuelve un único track aleatorio por request (`app/api/stations/[id]/next-track/route.ts`),
  nunca la lista completa de IDs de YouTube de una estación.
- **Auth**: NextAuth con Credentials Provider, contraseñas con bcrypt
  (`lib/auth.ts`), sesión JWT de 2 horas, cookie `__Host-` con
  `httpOnly + secure + sameSite=strict`.
- **2FA obligatorio**: TOTP con `otplib`, verificado en el mismo `authorize()`
  de NextAuth antes de emitir sesión.
- **Fuerza bruta**: rate limit de 5 intentos / 15 min por IP en login
  (`lib/rateLimit.ts`), más bloqueo de cuenta (`failedLogins` / `lockedUntil`
  en `AdminUser`) tras 5 fallos, independiente de la IP.
- **Rutas protegidas a nivel de servidor**: `middleware.ts` bloquea
  `/admin/**` y `/api/admin/**` completos si no hay sesión válida — no es
  solo ocultar el link en el frontend.
- **CSRF**: patrón double-submit cookie (`lib/csrf.ts`) para todos los
  POST/DELETE del panel — el cliente pide un token en `/api/admin/csrf` y lo
  reenvía en el header `x-csrf-token`.
- **Rate limiting en todos los endpoints públicos**: `/api/stations`,
  `/api/stations/[id]/next-track` y el buscador de YouTube del admin
  (para cuidar la cuota de la API).
- **Validación estricta**: todos los inputs pasan por `zod` antes de
  tocar la base de datos; los textos dinámicos (títulos, nombres de canal)
  se sanitizan con `isomorphic-dompurify` (`lib/sanitize.ts`) antes de
  guardarse o renderizarse.
- **Auditoría**: cada creación/borrado de estación o track queda registrado
  en la tabla `AuditLog` con quién, qué y cuándo (`lib/audit.ts`).
- **Headers de seguridad**: CSP, `X-Frame-Options: DENY`, HSTS, etc. en
  `next.config.js`, con la CSP permitiendo únicamente lo estrictamente
  necesario (YouTube embebido + Google Fonts).
- **CORS restringido**: los endpoints `/api/**` solo aceptan origen
  `APP_ORIGIN`.

En producción (Vercel), configura `UPSTASH_REDIS_REST_URL` y
`UPSTASH_REDIS_REST_TOKEN` (plan gratuito en [upstash.com](https://upstash.com))
para que el rate limiting funcione correctamente entre instancias
serverless — sin esto, cae a un store en memoria que no es confiable en
un entorno multi-instancia.

## 6. Despliegue en Vercel

1. Sube el repo a GitHub/GitLab.
2. Importa el proyecto en Vercel.
3. Agrega todas las variables de `.env.example` en Vercel → Settings →
   Environment Variables (usa las credenciales reales, no las de ejemplo).
4. Deploy. El comando `build` ya corre `prisma generate` automáticamente.
5. Corre `npm run db:push` y `npm run admin:create` una vez, apuntando tu
   `.env` local a la base de datos de producción (o usa un job manual).

## 7. Estructura del proyecto

```
app/
  page.tsx                    → home pública (grid de estaciones)
  descargo/page.tsx           → descargo de responsabilidad
  admin/                      → panel privado (protegido por middleware.ts)
  api/stations/**             → API pública, solo lectura, rate-limited
  api/admin/**                → API del panel, protegida + CSRF + auditoría
  api/auth/[...nextauth]/     → NextAuth
components/
  PlayerProvider.tsx          → contexto global del reproductor (persiste entre rutas)
  MiniPlayer.tsx               → UI del reproductor persistente
  StationCard.tsx / StationSkeleton.tsx / SurpriseButton.tsx / Footer.tsx
lib/
  prisma.ts / prismaPublic.ts → clientes DB separados (escritura vs solo-lectura)
  auth.ts                     → configuración NextAuth + 2FA
  rateLimit.ts / csrf.ts / sanitize.ts / audit.ts / youtube.ts
prisma/
  schema.prisma / seed.ts / README-roles.sql
scripts/create-admin.ts       → crea el usuario admin + secreto 2FA
middleware.ts                 → protección de /admin y /api/admin a nivel servidor
```

## 8. Nota sobre el reproductor

El audio se sirve ocultando el iframe de YouTube (`display:none` vía
`sr-only`) y controlándolo con la YouTube IFrame Player API
(`lib/youtube.ts` + `components/PlayerProvider.tsx`). El `PlayerProvider`
vive en `app/layout.tsx`, por fuera de las páginas, así que el audio sigue
sonando aunque el usuario navegue entre `/`, `/descargo`, etc. — el iframe
nunca se desmonta.

Ten en cuenta que la reproducción automática de audio con sonido está
sujeta a las políticas de autoplay del navegador: normalmente requiere que
el usuario haya interactuado con la página (el propio click en "Escuchar
estación" ya cuenta como esa interacción).
