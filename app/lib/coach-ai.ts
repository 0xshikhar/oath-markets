import { coachToneLabel, normalizeCoachTone } from "@/lib/coach-tone";

const DEFAULT_MODEL_ID = "moonshotai.kimi-k2.5";
const DEFAULT_REGION = "us-east-1";
const DEFAULT_TIMEOUT_MS = 12_000;

export type CoachEvent =
  | "OATH_CREATED"
  | "DAILY_CHECKIN"
  | "PROOF_SUBMITTED"
  | "STREAK_RISK"
  | "MILESTONE"
  | "COMPLETION"
  | "FAILURE"
  | "USER_REPLY";

export type CoachMessageContext = {
  event: CoachEvent;
  coachTone?: string | null;
  commitmentTitle: string;
  commitmentDescription?: string | null;
  category: string;
  proofType: string;
  dayNumber: number;
  totalDays: number;
  proofCount: number;
  requiredProofDays: number;
  believerCount: number;
  believerPoolSol?: string | null;
  timezone?: string | null;
  notifyTime?: string | null;
  recentProofText?: string | null;
  recentUserReply?: string | null;
  recentCoachMessage?: string | null;
};

type BedrockConfig = {
  apiKey: string;
  baseUrl: string;
  modelId: string;
  timeoutMs: number;
};

function trimEnv(value?: string | null) {
  return value?.trim() || "";
}

function resolveBedrockConfig(): BedrockConfig | null {
  const apiKey =
    trimEnv(process.env.IMAGINE_BEDROCK_API_KEY) ||
    trimEnv(process.env.BEDROCK_API_KEY) ||
    trimEnv(process.env.AWS_BEARER_TOKEN_BEDROCK);

  if (!apiKey) {
    return null;
  }

  const region = trimEnv(process.env.BEDROCK_REGION) || DEFAULT_REGION;
  const baseUrl =
    trimEnv(process.env.MOONSHOT_BASE_URL) ||
    trimEnv(process.env.OPENAI_BASE_URL) ||
    `https://bedrock-mantle.${region}.api.aws/v1`;
  const modelId = trimEnv(process.env.MOONSHOT_MODEL_ID) || DEFAULT_MODEL_ID;
  const timeoutMs = parseTimeoutMs(process.env.MOONSHOT_TIMEOUT_MS);

  return {
    apiKey,
    baseUrl,
    modelId,
    timeoutMs,
  };
}

function parseTimeoutMs(value?: string | null) {
  const parsed = Number(value?.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.max(Math.round(parsed), 2_000), 30_000);
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function clip(value: string | null | undefined, max = 220) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 3)}...`;
}

function getToneGuidance(value?: string | null) {
  switch (normalizeCoachTone(value)) {
    case "DRILL_SERGEANT":
      return "Direct, demanding, and impossible to ignore.";
    case "NEUTRAL_ANALYST":
      return "Calm, data-driven, and precise.";
    case "SUPPORTIVE_FRIEND":
    default:
      return "Warm, grounded, and steady.";
  }
}

function getEventGuidance(event: CoachEvent) {
  switch (event) {
    case "OATH_CREATED":
      return "Welcome the user, acknowledge the new oath, and set the tone for the journey ahead.";
    case "PROOF_SUBMITTED":
      return "Acknowledge the proof, reinforce the streak, and name the next concrete action.";
    case "STREAK_RISK":
      return "Call out the risk clearly and push for an immediate, smaller action today.";
    case "MILESTONE":
      return "Recognize the milestone, then keep the pressure on the next checkpoint.";
    case "COMPLETION":
      return "Mark the commitment as complete and connect the result to reputation.";
    case "FAILURE":
      return "Acknowledge the failure plainly and keep the tone accountable, not dramatic.";
    case "USER_REPLY":
      return "Respond directly to the user's message and keep the thread moving.";
    case "DAILY_CHECKIN":
    default:
      return "Send a short daily check-in that is specific to the oath and the current pace.";
  }
}

function buildPrompt(context: CoachMessageContext) {
  const paceBaseline = Math.max(context.dayNumber - 1, 0);
  const paceDelta = context.proofCount - paceBaseline;
  const paceLabel =
    paceDelta > 0
      ? `Ahead by ${paceDelta}`
      : paceDelta < 0
        ? `Behind by ${Math.abs(paceDelta)}`
        : "On pace";

  const lines = [
    `Commitment: ${context.commitmentTitle}`,
    `Category: ${context.category}`,
    `Proof type: ${context.proofType}`,
    context.commitmentDescription
      ? `Description: ${clip(context.commitmentDescription, 180)}`
      : null,
    `Progress: day ${context.dayNumber} of ${context.totalDays}`,
    `Proofs logged: ${context.proofCount} / ${context.requiredProofDays}`,
    `Pace: ${paceLabel}`,
    `Believers: ${context.believerCount}`,
    context.believerPoolSol ? `Believer pool: ${context.believerPoolSol} SOL` : null,
    context.timezone ? `Timezone: ${context.timezone}` : null,
    context.notifyTime ? `Notify time: ${context.notifyTime}` : null,
    clip(context.recentProofText, 180)
      ? `Recent proof: ${clip(context.recentProofText, 180)}`
      : null,
    clip(context.recentUserReply, 180)
      ? `Recent user reply: ${clip(context.recentUserReply, 180)}`
      : null,
    clip(context.recentCoachMessage, 180)
      ? `Recent coach message: ${clip(context.recentCoachMessage, 180)}`
      : null,
    `Event: ${context.event}`,
    `Tone: ${coachToneLabel(context.coachTone)}`,
    "Write 1-3 sentences, under 60 words. End with one concrete action for today.",
    "Do not use emojis or bullet points.",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildFallbackCoachMessage(context: CoachMessageContext) {
  const tone = normalizeCoachTone(context.coachTone);
  const event = context.event;
  const paceBaseline = Math.max(context.dayNumber - 1, 0);
  const paceDelta = context.proofCount - paceBaseline;

  const opener = {
    DRILL_SERGEANT: "No excuses.",
    SUPPORTIVE_FRIEND: "Stay steady.",
    NEUTRAL_ANALYST: "Here is the read.",
  }[tone];

const eventLead = {
    OATH_CREATED: "Your commitment is now live.",
    DAILY_CHECKIN: `Day ${context.dayNumber} is active.`,
    PROOF_SUBMITTED: "The proof is logged.",
    STREAK_RISK: "You are behind pace.",
    MILESTONE: "You hit a milestone.",
    COMPLETION: "The oath is complete.",
    FAILURE: "The streak ended early.",
    USER_REPLY: "Your note is in the thread.",
  }[event];

  const action = {
    OATH_CREATED:
      "Submit your first proof today to build the streak and set the tone.",
    DAILY_CHECKIN:
      paceDelta < 0
        ? "Shrink the next action and make the next proof visible today."
        : "Keep the next proof short and visible before the day closes.",
    PROOF_SUBMITTED:
      "Protect the momentum and line up the next visible step now.",
    STREAK_RISK:
      "Stop waiting and submit a smaller proof today before the gap widens.",
    MILESTONE:
      "Lock in the next checkpoint and do not let the pace soften.",
    COMPLETION:
      "Capture the result, then use the win to sharpen the next oath.",
    FAILURE:
      "Review the failure, accept the loss, and reset with a cleaner plan.",
    USER_REPLY:
      "Answer with one concrete step and keep the thread public.",
  }[event];

  return `${opener} ${eventLead} ${context.commitmentTitle}. ${action}`;
}

function extractChoiceContent(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const choices = (value as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }

  const firstChoice = choices[0] as {
    message?: {
      content?: unknown;
    };
    delta?: {
      content?: unknown;
    };
    text?: unknown;
  };

  const messageContent =
    firstChoice.message?.content ?? firstChoice.delta?.content ?? firstChoice.text;

  if (typeof messageContent === "string") {
    return messageContent.trim();
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object") {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function normalizeCoachCopy(value: string) {
  return value
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function summarizeFetchError(response: Response) {
  return response
    .text()
    .then((body) => {
      const detail = body.trim();
      if (!detail) {
        return `Bedrock request failed with status ${response.status}`;
      }

      return `Bedrock request failed with status ${response.status}: ${detail.slice(0, 240)}`;
    })
    .catch(() => `Bedrock request failed with status ${response.status}`);
}

export function formatLamportsToSolLabel(lamports: bigint) {
  const whole = lamports / 1_000_000_000n;
  const fraction = lamports % 1_000_000_000n;

  if (fraction === 0n) {
    return whole.toString();
  }

  const decimals = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return decimals ? `${whole}.${decimals.slice(0, 2)}` : whole.toString();
}

export function getZonedDateParts(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(date);

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? "";

    return {
      dateKey: `${get("year")}-${get("month")}-${get("day")}`,
      hour: Number(get("hour") || 0),
      minute: Number(get("minute") || 0),
    };
  } catch {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(date);

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? "";

    return {
      dateKey: `${get("year")}-${get("month")}-${get("day")}`,
      hour: Number(get("hour") || 0),
      minute: Number(get("minute") || 0),
    };
  }
}

export function formatZonedDateKey(date: Date, timeZone: string) {
  return getZonedDateParts(date, timeZone).dateKey;
}

function shouldUseHourWindow(now: Date, timeZone: string, notifyTime?: string | null) {
  if (!notifyTime) {
    return true;
  }

  const [targetHourRaw] = notifyTime.split(":");
  const targetHour = Number(targetHourRaw);
  if (!Number.isFinite(targetHour)) {
    return true;
  }

  return getZonedDateParts(now, timeZone).hour === targetHour;
}

export async function generateCoachMessage(context: CoachMessageContext): Promise<string> {
  const fallback = buildFallbackCoachMessage(context);
  const config = resolveBedrockConfig();

  if (!config) {
    return fallback;
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(
      `${normalizeBaseUrl(config.baseUrl)}chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.modelId,
          messages: [
            {
              role: "system",
              content: [
                "You are OATH's AI accountability coach.",
                `Tone: ${getToneGuidance(context.coachTone)}`,
                `Event guidance: ${getEventGuidance(context.event)}`,
                "Keep replies direct, public, and accountable.",
                "Write no more than 3 sentences.",
                "Do not use emojis, bullet points, or hedging.",
                "Always end with one concrete action for today.",
              ].join(" "),
            },
            {
              role: "user",
              content: buildPrompt(context),
            },
          ],
          max_tokens: 160,
          temperature: 0.35,
          stream: false,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(await summarizeFetchError(response));
    }

    const payload = (await response.json()) as unknown;
    const content = extractChoiceContent(payload);
    if (!content) {
      return fallback;
    }

    const normalized = normalizeCoachCopy(content);
    console.info(
      `[COACH_AI] model=${config.modelId} event=${context.event} latency=${Date.now() - startedAt}ms`
    );

    return normalized;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown Bedrock failure";
    console.warn(`[COACH_AI] Falling back to local copy: ${reason}`);
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

export function shouldSendCoachCheckInNow(
  now: Date,
  timeZone: string,
  notifyTime?: string | null
) {
  return shouldUseHourWindow(now, timeZone, notifyTime);
}
