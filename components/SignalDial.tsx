"use client";

import { usePlayer, type StationSummary } from "@/components/PlayerProvider";

const FREQ_MIN = 88.0;
const FREQ_MAX = 108.0;

/** Asigna a cada estación una frecuencia FM determinística según su posición
 * en la lista, repartida uniformemente entre 88.0 y 108.0 — así "Sorpréndeme"
 * y el catálogo siempre coinciden con lo que marca el dial. */
export function frequencyFor(index: number, total: number): number {
  if (total <= 1) return FREQ_MIN;
  return FREQ_MIN + (index / (total - 1)) * (FREQ_MAX - FREQ_MIN);
}

const TICKS = Array.from({ length: 21 }, (_, i) => FREQ_MIN + i);
const LABELS = [88, 92, 96, 100, 104, 108];

export default function SignalDial({ stations }: { stations: StationSummary[] }) {
  const { station, playStation } = usePlayer();
  const activeIndex = station ? stations.findIndex((s) => s.id === station.id) : -1;
  const tuned = activeIndex >= 0;
  const freq = tuned ? frequencyFor(activeIndex, stations.length) : null;
  const pct = freq !== null ? ((freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * 100 : 0;

  function handleDialClick(e: React.MouseEvent<HTMLDivElement>) {
  if (stations.length === 0) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const clickedFreq = FREQ_MIN + clickPct * (FREQ_MAX - FREQ_MIN);

  // Busca la estación cuya frecuencia esté más cerca de donde tocaron
  let closestIndex = 0;
  let closestDistance = Infinity;
  stations.forEach((_, i) => {
    const freq = frequencyFor(i, stations.length);
    const distance = Math.abs(freq - clickedFreq);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  });

  const target = stations[closestIndex];
  if (target) void playStation(target);
}

  return (
    <div className="border border-wire bg-surface px-4 sm:px-6 py-4 sm:py-5">
      {/* Escala del dial */}
      <div
  className="relative h-8 cursor-pointer"
  onClick={handleDialClick}
  role="slider"
  aria-label="Sintonizar estación por frecuencia"
  aria-valuemin={FREQ_MIN}
  aria-valuemax={FREQ_MAX}
  aria-valuenow={freq ?? FREQ_MIN}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    handleDialClick({
      currentTarget: e.currentTarget,
      clientX: rect.left + rect.width / 2,
    } as React.MouseEvent<HTMLDivElement>);
  }}
>
        {/* marcas finas */}
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {TICKS.map((t) => (
            <span
              key={t}
              className={`w-px ${Math.round(t) % 4 === 0 ? "h-4 bg-ink/35" : "h-2 bg-ink/15"}`}
            />
          ))}
        </div>
        {/* números de referencia */}
        <div className="absolute inset-x-0 top-5 flex justify-between font-mono text-[9px] text-ink/40">
          {LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        {/* indicador — barrido físico, por eso usa una duración más larga (sweep) */}
        <div
          className="absolute top-0 -translate-x-1/2 transition-[left] duration-sweep ease-enter"
          style={{ left: `${tuned ? pct : 0}%`, opacity: tuned ? 1 : 0.25 }}
          aria-hidden="true"
        >
          <div className="w-[2px] h-6" style={{ backgroundColor: tuned ? station!.accentColor : "#EFEAD8" }} />
          <div
            className="w-2 h-2 -ml-[3.5px] -mt-1 rotate-45"
            style={{ backgroundColor: tuned ? station!.accentColor : "#EFEAD8" }}
          />
        </div>
      </div>

      {/* lectura de frecuencia */}
      <div className="mt-3 flex items-baseline gap-3 border-t border-wire pt-3">
        <span
          className={`w-1.5 h-1.5 shrink-0 rounded-full ${
            tuned ? "bg-led animate-led-blink" : "bg-ink/20"
          }`}
          aria-hidden="true"
        />
        {tuned ? (
          <p className="font-mono text-sm sm:text-base tracking-tight text-ink truncate">
            <span className="text-led font-bold">{freq!.toFixed(1)} FM</span>
            <span className="text-ink/40"> — sintonizado en </span>
            <span className="uppercase">{station!.name}</span>
          </p>
        ) : (
          <p className="font-mono text-sm text-ink/40 animate-static-flicker">
            — sin señal · elige una estación —
          </p>
        )}
      </div>
    </div>
  );
}
