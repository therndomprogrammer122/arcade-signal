"use client";

import { usePlayer } from "@/components/PlayerProvider";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const { station, track, isPlaying, isBuffering, progressSec, volume, isMuted, togglePlay, skip, setVolume, toggleMute } = usePlayer();
  if (!station) return null;

  const duration = track?.durationSec ?? 0;
  const pct = duration > 0 ? Math.min(100, (progressSec / duration) * 100) : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface2 border-t border-wire"
      role="region"
      aria-label="Reproductor"
    >
      {/* barra de progreso — línea delgada tipo cinta, sin gradiente */}
      <div className="h-[2px] w-full bg-ink/10">
        <div
          className="h-full transition-[width] duration-player ease-enter"
          style={{ width: `${pct}%`, backgroundColor: station.accentColor }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-4">
        {/* LED de estado — el único acento saturado del sistema */}
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isPlaying ? "bg-led animate-led-blink" : "bg-ink/25"
          }`}
          aria-hidden="true"
        />

        <div
          className="w-1 h-9 shrink-0 hidden sm:block"
          style={{ backgroundColor: station.accentColor }}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40">
            Sonando ahora — {station.name}
          </p>
          <p className="font-sans text-sm font-medium truncate text-ink">
            {isBuffering ? "Cargando siguiente pista…" : track?.title ?? "—"}
          </p>
        </div>

        {/* contador tipo cinta */}
        <div className="font-mono text-[11px] text-ink/45 hidden sm:block tabular-nums bg-surface px-2 py-1 border border-wire">
          {formatTime(progressSec)}
          {duration ? ` / ${formatTime(duration)}` : ""}
        </div>

        <div className="flex items-center gap-2 shrink-0">
  <button
    onClick={togglePlay}
    aria-label={isPlaying ? "Pausar" : "Reproducir"}
    className="w-9 h-9 flex items-center justify-center border border-wire text-ink transition-colors duration-instant ease-enter hover:bg-ink hover:text-void"
  >
    {isPlaying ? (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <rect x="1" y="0" width="3.5" height="12" />
        <rect x="7.5" y="0" width="3.5" height="12" />
      </svg>
    ) : (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M0 0L12 6L0 12Z" />
      </svg>
    )}
  </button>
  <button
    onClick={skip}
    aria-label="Siguiente pista"
    className="w-9 h-9 flex items-center justify-center border border-wire text-ink transition-colors duration-instant ease-enter hover:bg-ink hover:text-void"
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M0 0L7 6L0 12Z" />
      <rect x="8.5" y="0" width="2" height="12" />
    </svg>
  </button>

  {/* Botón de mute — visible en todas las pantallas, esencial por el autoplay muteado en mobile */}
<div className="flex items-center gap-2 pl-2 border-l border-wire">
  <button
    onClick={toggleMute}
    aria-label={isMuted ? "Activar sonido" : "Silenciar"}
    className="w-9 h-9 flex items-center justify-center text-ink/60 hover:text-ink transition-colors duration-instant ease-enter"
  >
    {isMuted || volume === 0 ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M1 5H3.5L7 2V12L3.5 9H1V5Z" />
        <path d="M9.5 5L12.5 8M12.5 5L9.5 8" strokeLinecap="round" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M1 5H3.5L7 2V12L3.5 9H1V5Z" />
        <path d="M9.5 4.5C10.5 5.5 10.5 8.5 9.5 9.5" strokeLinecap="round" />
      </svg>
    )}
  </button>
  {/* Slider de volumen — se oculta solo en mobile, ahí el volumen del sistema cubre ese ajuste fino */}
  <input
    type="range"
    min={0}
    max={100}
    value={isMuted ? 0 : volume}
    onChange={(e) => setVolume(Number(e.target.value))}
    aria-label="Volumen"
    className="hidden sm:block w-16 accent-ink"
  />
</div>
      </div>
    </div>
  </div>
  );
}
