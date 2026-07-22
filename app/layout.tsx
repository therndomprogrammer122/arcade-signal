import type { Metadata } from "next";
import { Unbounded, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import PlayerProvider from "@/components/PlayerProvider";

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

// PlayerProvider vive aquí, FUERA del segmento [locale], a propósito:
// así al cambiar de idioma (que navega entre /es y /en) el reproductor
// nunca se desmonta, y la música sigue sonando durante el cambio.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void text-ink font-sans antialiased min-h-screen flex flex-col">
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}