import { runDiscoverAmazonProduct } from "../ai/run-discover-amazon-product.js";
import type { JobPayload } from "./types.js";

export const handleDiscoverAmazonProduct = async (
  payload: JobPayload,
): Promise<void> => {
  await runDiscoverAmazonProduct(payload);
};
