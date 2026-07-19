"use client";

interface Props {
  accentColor: string;
  isActive: boolean;
}

/**
 * Visualizador único para todas las estaciones — un pulso de señal que se
 * expande desde un punto central, usando el accentColor propio de cada
 * estación. Mismo diseño en todas, solo cambia el color.
 */
export default function StationVisualizer({ accentColor, isActive }: Props) {
  return (
    <div className="flex items-center justify-center py-2 h-10" aria-hidden="true">
      <div className="relative w-9 h-9 flex items-center justify-center">
        <span
          className="w-1.5 h-1.5 rounded-full z-10"
          style={{ backgroundColor: accentColor }}
        />
        {isActive ? (
          [0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full border animate-sonar-ping"
              style={{ borderColor: accentColor, animationDelay: `${i * 0.6}s` }}
            />
          ))
        ) : (
          <span
            className="absolute inset-0 rounded-full border opacity-20"
            style={{ borderColor: accentColor }}
          />
        )}
      </div>
    </div>
  );
}