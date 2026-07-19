import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().length(6).regex(/^\d+$/).optional().or(z.literal("")),
});

const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 2, // 2 horas — expiración corta como pide el brief
  },
  jwt: {
    // NEXTAUTH_SECRET firma el JWT de sesión (ver .env.example)
    maxAge: 60 * 60 * 2,
  },
  cookies: {
    sessionToken: {
    name:
      process.env.NODE_ENV === "production"
        ? `__Host-arcade-signal.session-token`
        : `arcade-signal.session-token`,
    options: {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Código 2FA", type: "text" },
      },
      async authorize(raw, req) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, totpCode } = parsed.data;

        // Rate limit agresivo: máx 5 intentos / 15 min por IP en el propio authorize
        // (capa adicional a la que ya aplica app/api/admin/login/route antes de llegar aquí)
        const rawHeaders = (req?.headers ?? {}) as Record<string, string | undefined>;
        const forwardedFor = rawHeaders["x-forwarded-for"];
        const ip =
        forwardedFor?.split(",")[0]?.trim() ||
        rawHeaders["x-real-ip"] ||
        "unknown";
        const rl = await rateLimit(`login:${ip}`, LOCK_THRESHOLD, LOCK_MINUTES * 60);
        if (!rl.success) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) {
          const failedLogins = user.failedLogins + 1;
          const lockedUntil =
            failedLogins >= LOCK_THRESHOLD
              ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
              : null;
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { failedLogins, lockedUntil },
          });
          return null;
        }

        // Verificación 2FA obligatoria si ya está activada para esta cuenta
        if (user.totpEnabled) {
          if (!totpCode) throw new Error("TOTP_REQUIRED");
          const valid = authenticator.verify({
            token: totpCode,
            secret: user.totpSecret!,
          });
          if (!valid) return null;
        }

        await prisma.adminUser.update({
          where: { id: user.id },
          data: { failedLogins: 0, lockedUntil: null },
        });

        await writeAuditLog({
          adminId: user.id,
          action: "LOGIN_SUCCESS",
          ip,
        });

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.uid as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
