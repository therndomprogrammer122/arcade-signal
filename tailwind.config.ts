import type { Config } from "tailwindcss";

// Sistema de tokens — ARCADE SIGNAL
// Dirección: dial de radio pirata / cassette deck apagado.
// Fondo: casi-negro cálido (deck apagado), nunca negro puro.
// Texto: crema fósforo (glow de tubo CRT ya frío), nunca blanco puro.
// Único acento saturado real del sistema: el LED verde "en vivo" — todo lo
// demás (incluido accentColor por estación) se mantiene mate y contenido.

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // -- nuevos tokens (usados por la UI pública rediseñada) --
        void: "#131311", // deck apagado — fondo principal
        surface: "#1C1A15", // panel/cassette elevado
        surface2: "#221F19", // panel aún más elevado (mini player)
        ink: "#EFEAD8", // crema fósforo — texto principal
        wire: "rgba(239,234,216,0.10)", // hairline/cableado sobre fondo oscuro
        led: "#8BFF9E", // único acento saturado — indicador "en vivo"

        // -- tokens legados (siguen usándolos las rutas /admin, sin tocar) --
        bone: "#FBFBFA",
        carbon: "#121212",
        rule: "rgba(18,18,18,0.08)",
        "rule-dark": "rgba(251,251,250,0.12)",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        widemono: "0.08em",
      },
      transitionTimingFunction: {
        enter: "cubic-bezier(0.16, 1, 0.3, 1)",
        exit: "cubic-bezier(0.7, 0, 0.84, 0)",
      },
      transitionDuration: {
        instant: "100ms",
        quick: "140ms",
        player: "180ms",
        sweep: "480ms", // barrido físico del dial de frecuencia (caso ambiental, no feedback de click)
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "2px",
      },
      keyframes: {
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.6" },
        },
        "led-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "reel-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "static-flicker": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.8" },
        },
        "mute-toggle": {
          from: { opacity: "0", transform: "scale(0.6) rotate(-8deg)" },
          to: { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        // -- motivos del StationVisualizer (uno por estación, según franquicia) --
        "pulse-ring": {
          "0%, 100%": { opacity: "0.15", transform: "scale(0.9)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        "sonar-ping": {
          "0%": { transform: "scale(0.4)", opacity: "0.8" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "particle-float": {
          "0%": { transform: "translateY(0)", opacity: "0.9" },
          "100%": { transform: "translateY(-140%)", opacity: "0" },
        },
        "scanline-move": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "eq-bar": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "skeleton-pulse": "skeleton-pulse 600ms cubic-bezier(0.16,1,0.3,1) infinite",
        // Animaciones ambientales/físicas continuas: usan linear a propósito
        // (simulan un motor o tubo real a velocidad constante), a diferencia
        // de las transiciones de UI por estado, que usan las curvas enter/exit.
        "led-blink": "led-blink 1.6s ease-in-out infinite",
        "reel-spin": "reel-spin 3s linear infinite",
        "static-flicker": "static-flicker 2.2s ease-in-out infinite",
        "mute-toggle": "mute-toggle 180ms cubic-bezier(0.16,1,0.3,1)",

        // -- motivos del StationVisualizer --
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
        "sonar-ping": "sonar-ping 2s ease-out infinite",
        "particle-float": "particle-float 2.6s ease-in infinite",
        "scanline-move": "scanline-move 2.4s linear infinite",
        "eq-bar": "eq-bar 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
