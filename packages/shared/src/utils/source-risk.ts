export type SourceRiskLevel = "low" | "medium" | "high";

export type SourceRiskAssessment = {
  level: SourceRiskLevel;
  rightsStatus: "owned" | "licensed" | "permission_required" | "unknown";
  hints: string[];
};

const RISKY_TITLE_PATTERNS = [
  /\bofficial\s+(music\s+)?video\b/i,
  /\bmusic\s+video\b/i,
  /\btrailer\b/i,
  /\bhighlights?\b/i,
  /\bnfl\b|\bnba\b|\bmlb\b|\bfifa\b/i,
  /\blive\s+concert\b/i,
  /\b(full\s+)?movie\b/i,
  /\bepisode\s+\d+/i,
];

const RISKY_CHANNEL_PATTERNS = [
  /\bvevo\b/i,
  /\brecords\b/i,
  /\bsports\b/i,
  /\bespn\b/i,
  /\bnfl\b|\bnba\b/i,
];

export const assessSourceRisk = (input: {
  sourceType: string;
  sourceUrl: string;
  title?: string | null;
  channel?: string | null;
}): SourceRiskAssessment => {
  const hints: string[] = [];
  let level: SourceRiskLevel = "low";

  const title = input.title ?? "";
  const channel = input.channel ?? "";

  if (input.sourceType === "upload") {
    return {
      level: "low",
      rightsStatus: "owned",
      hints: ["Uploaded files are treated as your own content."],
    };
  }

  if (input.sourceType === "direct_url") {
    return {
      level: "medium",
      rightsStatus: "permission_required",
      hints: [
        "Confirm you have rights to use this direct URL before clipping.",
      ],
    };
  }

  for (const pattern of RISKY_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      level = "high";
      hints.push(
        "Title suggests licensed or third-party content (music, sports, or film).",
      );
      break;
    }
  }

  for (const pattern of RISKY_CHANNEL_PATTERNS) {
    if (pattern.test(channel)) {
      if (level !== "high") {
        level = "medium";
      }
      hints.push("Channel name may indicate official or licensed media.");
      break;
    }
  }

  if (input.sourceType === "youtube" || input.sourceType === "vimeo") {
    if (level === "low") {
      hints.push(
        "Third-party videos require permission before repurposing. Only clip content you own or are licensed to use.",
      );
    }
    return {
      level,
      rightsStatus: "permission_required",
      hints,
    };
  }

  return {
    level,
    rightsStatus: "unknown",
    hints:
      hints.length > 0
        ? hints
        : ["Review rights before publishing clips from this source."],
  };
};
