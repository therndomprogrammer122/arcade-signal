import type { Metadata } from "next";
import { Unbounded, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["500", "600", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARCADE SIGNAL — Radio de videojuegos",
  description:
    "Elige una estación, dale play, y deja sonando la banda sonora de tu franquicia favorita. Proyecto de fans sin fines de lucro.",
  icons: {
    icon: [
      { url: "/icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon/apple-touch-icon.png",
  },
  manifest: "/icon/site.webmanifest",
};

// NOTA: PlayerProvider (el reproductor persistente) ya NO vive aquí — se
// movio a app/[locale]/layout.tsx para que quede DENTRO del sistema de
// idiomas (NextIntlClientProvider). Antes estaba afuera, por eso el
// MiniPlayer nunca pudo traducirse sin romper la app entera.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void text-ink font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
