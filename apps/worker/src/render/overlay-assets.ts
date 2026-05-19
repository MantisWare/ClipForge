import type { OverlayRenderItem } from "@clipforge/shared";
import type { ClipOverlay, ProductLink } from "@clipforge/database";

export const mapClipOverlaysToRenderItems = (
  overlays: Array<
    ClipOverlay & {
      productLink: ProductLink | null;
    }
  >,
): OverlayRenderItem[] =>
  overlays.map((o) => {
    const style =
      typeof o.style === "object" && o.style !== null
        ? (o.style as Record<string, unknown>)
        : {};

    return {
      id: o.id,
      type: o.overlayType,
      startMs: o.startMs,
      endMs: o.endMs,
      position:
        typeof o.position === "object" && o.position !== null
          ? (o.position as OverlayRenderItem["position"])
          : { anchor: "bottom_right", marginPx: 80 },
      style,
      compliance: o.compliance,
      assets: {
        title:
          o.productLink?.title ??
          (typeof style.headline === "string" ? style.headline : undefined) ??
          (typeof style.title === "string" ? style.title : undefined),
        cta: typeof style.cta === "string" ? style.cta : undefined,
        promoCode:
          typeof style.promoCode === "string" ? style.promoCode : undefined,
        disclosure:
          o.productLink?.disclosureText ??
          (typeof style.disclosure === "string" ? style.disclosure : undefined),
        headline:
          typeof style.headline === "string" ? style.headline : undefined,
        imageStorageKey: o.productLink?.imageStorageKey ?? undefined,
        imagePath:
          typeof style.imagePath === "string" ? style.imagePath : undefined,
      },
    };
  });
