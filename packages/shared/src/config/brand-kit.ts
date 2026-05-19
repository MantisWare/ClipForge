export const buildBrandKitLogoStorageKey = (
  workspaceId: string,
  brandKitId: string,
  extension: "png" | "jpg" | "webp",
): string =>
  `brand-kits/${workspaceId}/${brandKitId}/logo.${extension}`;
