import type { JobPayload } from "../handlers/types.js";
import { runDiscoverAffiliateProduct } from "./run-discover-affiliate-product.js";

/** @deprecated Use runDiscoverAffiliateProduct — kept for job name compatibility */
export const runDiscoverAmazonProduct = async (
  payload: JobPayload,
): Promise<Record<string, unknown>> => runDiscoverAffiliateProduct(payload);
