"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Props = {
  riskLevel?: string;
  rightsStatus?: string;
  hints?: string[];
};

export const SourceRiskBanner = ({
  riskLevel,
  rightsStatus,
  hints = [],
}: Props) => {
  if (riskLevel === undefined && rightsStatus === undefined) {
    return null;
  }

  const isHigh = riskLevel === "high";
  const isMedium = riskLevel === "medium";

  return (
    <Card
      className={
        isHigh
          ? "border-danger/40 bg-danger/10"
          : isMedium
            ? "border-warning/40 bg-warning/10"
            : "border-border"
      }
    >
      <CardTitle
        className={
          isHigh ? "text-danger" : isMedium ? "text-warning" : "text-foreground"
        }
      >
        {isHigh
          ? "High rights risk"
          : isMedium
            ? "Review rights before clipping"
            : "Rights reminder"}
      </CardTitle>
      <CardDescription className="space-y-1">
        {rightsStatus !== undefined && (
          <p className="text-sm">Status: {rightsStatus.replace(/_/g, " ")}</p>
        )}
        {hints.map((hint) => (
          <p key={hint} className="text-sm">
            {hint}
          </p>
        ))}
      </CardDescription>
    </Card>
  );
};
