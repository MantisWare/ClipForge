"use client";

import { AffiliateNetworkInfoButton } from "@/components/monetization/affiliate-network-info-button";
import type { AffiliateNetworkFieldId } from "@/lib/affiliate-network-links";
import { AFFILIATE_NETWORK_HELP } from "@/lib/affiliate-network-links";
import type { ReactNode } from "react";

type Props = {
  networkId: AffiliateNetworkFieldId;
  children: ReactNode;
};

export const AffiliateFieldLabel = ({ networkId, children }: Props) => {
  const help = AFFILIATE_NETWORK_HELP[networkId];

  return (
    <span className="mb-1 flex items-center gap-1.5 text-xs text-muted">
      <span>{children}</span>
      <AffiliateNetworkInfoButton help={help} />
    </span>
  );
};
