"use client";

import Image from "next/image";
import { usePlayer, type StationSummary } from "@/components/PlayerProvider";
import { frequencyFor } from "@/components/SignalDial";
import StationVisualizer from "@/components/StationVisualizer";

interface Props {
  station: StationSummary;
  index: number;
  total: number;
  featured?: boolean;
}

export default function StationCard({ station, index, total, featured }: Props) {
  const { station: current, playStation } = usePlayer();
  const isActive = current?.id === station.id;
  const catalogCode = `LD-${String(index + 1).padStart(2, "0")}`;
  const freq = frequencyFor(index, total);

  return (
    <button
      onClick={() => playStation(station)}
      aria-pressed={isActive}
      className={`group text-left w-full ${
        featured ? "aspect-[4/5]" : "aspect-square"
      } relative flex flex-col bg-surface border transition-colors duration-instant ease-enter ${
        isActive ? "border-ink/50" : "border-wire hover:border-ink/30"
      }`}
    >
      {/* Etiqueta de cassette — franja de color sólido de la estación, no toda la card */}
      <div
        className="relative h-2/5 shrink-0 flex items-center justify-center px-4"
        style={{ backgroundColor: station.accentColor }}
      >
        <Image
          src={station.logoUrl}
          alt={`Logo de ${station.franchise}`}
          width={200}
          height={200}
          className="object-contain h-[70%] w-auto"
        />
        {isActive && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-void/70 px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-led animate-led-blink" aria-hidden="true" />
            <span className="font-mono text-[8px] tracking-widemono uppercase text-ink">En vivo</span>
          </span>
        )}
      </div>

      {/* Carcasa del cassette */}
      <div className="flex-1 flex flex-col justify-between p-3 sm:p-4">
        <div className="flex items-start justify-between font-mono text-[9px] tracking-widemono uppercase text-ink/40">
          <span>{catalogCode}</span>
          <span>{freq.toFixed(1)} FM</span>
        </div>

        {/* Visualizador de señal — mismo diseño en todas las estaciones */}
        <StationVisualizer accentColor={station.accentColor} isActive={isActive} />

        <div>
          <p
            className={`font-serif font-semibold text-ink leading-[0.95] tracking-tightest ${
              featured ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
            }`}
          >
            {station.name}
          </p>
          <p className="font-mono text-[9px] tracking-widemono uppercase text-ink/40 mt-1 group-hover:text-led transition-colors duration-instant ease-enter">
            {isActive ? "Sonando ahora" : "Reproducir cassette"}
          </p>
        </div>
      </div>
    </button>
  );
}