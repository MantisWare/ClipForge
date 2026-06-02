"use client";

import type { AffiliateNetworkHelp } from "@/lib/affiliate-network-links";
import { Info } from "lucide-react";

type Props = {
  help: AffiliateNetworkHelp;
};

export const AffiliateNetworkInfoButton = ({ help }: Props) => {
  const openSignup = () => {
    window.open(help.signupUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={openSignup}
      className="inline-flex shrink-0 rounded-md p-0.5 text-muted transition-colors hover:bg-panel-2 hover:text-accent-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
      aria-label={help.title}
      title={help.title}
    >
      <Info className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
};
