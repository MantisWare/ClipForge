import type { OverlayCompliance } from "@clipforge/shared";

export type OverlayComplianceInput = {
  compliance: OverlayCompliance;
};

const DISCLOSURE_REQUIRED: OverlayCompliance[] = [
  "affiliate",
  "sponsored",
  "ad",
];

export const requiresDisclosure = (
  overlays: OverlayComplianceInput[],
): boolean =>
  overlays.some((o) => DISCLOSURE_REQUIRED.includes(o.compliance));

export const buildDisclosureBlock = (input: {
  defaultDisclosureText?: string | null;
  overlays: OverlayComplianceInput[];
  productDisclosures?: string[];
}): string | null => {
  if (!requiresDisclosure(input.overlays)) {
    return null;
  }

  const lines: string[] = [];
  if (
    input.defaultDisclosureText !== undefined &&
    input.defaultDisclosureText !== null &&
    input.defaultDisclosureText !== ""
  ) {
    lines.push(input.defaultDisclosureText);
  }

  if (input.productDisclosures !== undefined) {
    for (const d of input.productDisclosures) {
      if (d !== "" && !lines.includes(d)) {
        lines.push(d);
      }
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return lines.join("\n");
};
