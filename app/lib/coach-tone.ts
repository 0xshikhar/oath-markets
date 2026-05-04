export const coachToneValues = [
  "DRILL_SERGEANT",
  "SUPPORTIVE_FRIEND",
  "NEUTRAL_ANALYST",
] as const;

export type CoachTone = (typeof coachToneValues)[number];

const coachToneLookup: Record<string, CoachTone> = {
  DRILL_SERGEANT: "DRILL_SERGEANT",
  SUPPORTIVE_FRIEND: "SUPPORTIVE_FRIEND",
  NEUTRAL_ANALYST: "NEUTRAL_ANALYST",
};

export function normalizeCoachTone(value?: string | null): CoachTone {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_") ?? "";

  if (normalized in coachToneLookup) {
    return coachToneLookup[normalized];
  }

  if (normalized === "DRILLSERGEANT") {
    return "DRILL_SERGEANT";
  }

  if (normalized === "SUPPORTIVEFRIEND") {
    return "SUPPORTIVE_FRIEND";
  }

  if (normalized === "NEUTRALANALYST") {
    return "NEUTRAL_ANALYST";
  }

  return "SUPPORTIVE_FRIEND";
}

export function coachToneLabel(value?: string | null): string {
  switch (normalizeCoachTone(value)) {
    case "DRILL_SERGEANT":
      return "Direct and demanding";
    case "NEUTRAL_ANALYST":
      return "Data-driven and concise";
    case "SUPPORTIVE_FRIEND":
    default:
      return "Warm and steady";
  }
}
