export const buildProductLinkImageStorageKey = (
  workspaceId: string,
  productLinkId: string,
  extension: "png" | "jpg" | "webp",
): string =>
  `product-links/${workspaceId}/${productLinkId}/image.${extension}`;
