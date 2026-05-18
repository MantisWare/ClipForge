"use client";

import { RIGHTS_WARNING } from "@clipforge/shared";
import { Button } from "@/components/ui/button";
import type { FormEvent } from "react";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (rightsStatus: string) => void;
  isLoading?: boolean;
};

export const RightsConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: Props) => {
  const [confirmed, setConfirmed] = useState(false);
  const [rightsStatus, setRightsStatus] = useState("owned");

  if (!open) {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      return;
    }
    onConfirm(rightsStatus);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rights-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-panel p-6 shadow-xl"
      >
        <h2 id="rights-modal-title" className="text-lg font-semibold">
          Rights confirmation
        </h2>
        <p className="mt-2 text-sm text-muted">{RIGHTS_WARNING}</p>

        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Rights status</legend>
          {[
            { value: "owned", label: "I own this content" },
            { value: "licensed", label: "Licensed / Creative Commons" },
            {
              value: "permission_required",
              label: "I have explicit permission",
            },
            { value: "unknown", label: "Unknown / other" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rightsStatus"
                value={value}
                checked={rightsStatus === value}
                onChange={() => setRightsStatus(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            required
          />
          <span>
            I confirm I own this content or have permission to repurpose it.
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!confirmed || isLoading}>
            {isLoading ? "Importing…" : "Confirm & import"}
          </Button>
        </div>
      </form>
    </div>
  );
};
