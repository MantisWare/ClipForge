"use client";

import { getOverlaySafeAreas } from "@clipforge/shared";

type OverlayMinimal = {
  overlayType: string;
  position?: { anchor?: string; marginPx?: number };
};

type Props = { overlays: OverlayMinimal[] };

export const OverlayPreviewCanvas = ({ overlays }: Props) => {
  const safe = getOverlaySafeAreas();
  const widthPx = Math.min(Math.floor(safe.frameWidth / 4), 280);

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-lg border border-border bg-black"
      style={{
        aspectRatio: `${safe.frameWidth} / ${safe.frameHeight}`,
        maxHeight: "70vh",
        width: widthPx,
      }}
    >
      <div className="absolute inset-8 border border-dashed border-warning/60" />
      <div className="absolute bottom-24 left-8 right-8 border border-dashed border-warning/60" />

      <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center text-[9px] text-white/70">
        {overlays.length === 0 ? (
          <span>Safe areas (approx.)</span>
        ) : (
          overlays.map((o, i) => (
            <span key={`${o.overlayType}-${String(i)}`}>
              {o.overlayType.replace(/_/g, " ")} ({o.position?.anchor ?? "br"})
            </span>
          ))
        )}
      </div>
    </div>
  );
};
