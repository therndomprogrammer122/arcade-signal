"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      totpCode,
      redirect: false,
    });

    setLoading(false);

    if (res?.error === "TOTP_REQUIRED") {
      setNeedsTotp(true);
      return;
    }
    if (res?.error === "ACCOUNT_LOCKED") {
      setError("Cuenta bloqueada temporalmente por demasiados intentos fallidos.");
      return;
    }
    if (res?.error === "RATE_LIMITED") {
      setError("Demasiados intentos. Espera unos minutos.");
      return;
    }
    if (res?.error) {
      setError("Credenciales incorrectas.");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-2">
          Arcade Signal — Panel
        </p>
        <h1 className="font-serif tracking-tightest text-4xl mb-8">Acceder</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 block mb-1">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-carbon/20 px-3 py-2 font-sans text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-carbon/20 px-3 py-2 font-sans text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
            />
          </div>

          {needsTotp && (
            <div>
              <label className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 block mb-1">
                Código de verificación (2FA)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full border border-carbon/20 px-3 py-2 font-mono text-sm tracking-widest bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
                placeholder="000000"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-carbon py-2.5 font-mono text-[11px] tracking-widemono uppercase transition-colors duration-instant ease-enter hover:bg-carbon hover:text-bone disabled:opacity-40"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
