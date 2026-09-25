import type { KeyboardEvent } from "react";
import { BODY_SILHOUETTE, BODY_ZONES, type BodySide, type BodyZone } from "../bodyRegions";
import type { BodyMapLayer } from "../types";

type BodySilhouetteProps = {
  side: BodySide;
  layers: BodyMapLayer[];
  activeLayerId?: string | null;
  onToggleZone?: (zoneId: string) => void;
  heightClassName?: string;
};

export const BodySilhouette = ({
  side,
  layers,
  activeLayerId,
  onToggleZone,
  heightClassName = "h-[300px] sm:h-[340px]",
}: BodySilhouetteProps) => {
  const interactive = typeof onToggleZone === "function";
  const active = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];

  const renderZone = (zone: BodyZone) => {
    const selectedLayers = layers.filter((layer) => layer.zoneIds.includes(zone.id));
    const isActive = active?.zoneIds.includes(zone.id) ?? false;
    const color = selectedLayers[0]?.color ?? "currentColor";
    const opacity = selectedLayers.length ? Math.min(0.18 + (selectedLayers[0]?.intensity ?? 3) * 0.08, 0.56) : 0;
    const shared = interactive
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": `${zone.label}${isActive ? ", selecionado" : ""}`,
          onClick: () => onToggleZone?.(zone.id),
          onKeyDown: (event: KeyboardEvent<SVGElement>) => {
            if (event.key === "Enter" || event.key === " ") onToggleZone?.(zone.id);
          },
          className: "cursor-pointer outline-none transition-all hover:stroke-primary focus:stroke-primary",
        }
      : {
          className: "outline-none",
        };

    if (zone.shape === "ellipse") {
      const [cx, cy, rx, ry] = zone.values as number[];
      return (
        <g key={zone.id}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={color}
            fillOpacity={opacity}
            stroke={selectedLayers.length ? color : "currentColor"}
            strokeOpacity={selectedLayers.length ? 0.95 : 0.18}
            strokeWidth={selectedLayers.length ? 3 : 1.2}
            {...shared}
          />
          {selectedLayers.slice(1).map((layer, index) => (
            <ellipse
              key={layer.id}
              cx={cx + (index + 1) * 5}
              cy={cy}
              rx={Math.max(8, rx - (index + 1) * 4)}
              ry={Math.max(8, ry - (index + 1) * 4)}
              fill="none"
              stroke={layer.color}
              strokeWidth="3"
              pointerEvents="none"
            />
          ))}
        </g>
      );
    }

    return (
      <path
        key={zone.id}
        d={zone.values as string}
        fill={color}
        fillOpacity={opacity}
        stroke={selectedLayers.length ? color : "currentColor"}
        strokeOpacity={selectedLayers.length ? 0.9 : 0.12}
        strokeWidth={selectedLayers.length ? 2.5 : 1}
        {...shared}
      />
    );
  };

  return (
    <div className="text-center">
      <span className="text-xs font-semibold text-muted-foreground">{side === "front" ? "Frente" : "Costas"}</span>
      <svg
        viewBox="0 0 220 415"
        className={`mx-auto mt-2 w-full max-w-[180px] ${heightClassName}`}
        aria-label={`Mapa corporal de ${side === "front" ? "frente" : "costas"}`}
      >
        <path d={BODY_SILHOUETTE} className="fill-primary/5 stroke-primary/20" strokeWidth="1.5" />
        <path
          d="M82 91c18 13 38 13 56 0M77 164c21 10 45 10 66 0M110 95v139M80 233h60M85 387c8 6 16 6 23 0M112 387c8 6 16 6 23 0"
          className="fill-none stroke-primary/15"
          strokeWidth="1.2"
          pointerEvents="none"
        />
        {BODY_ZONES.filter((zone) => zone.side === side).map(renderZone)}
      </svg>
    </div>
  );
};
