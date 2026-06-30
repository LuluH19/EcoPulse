export interface UsageProfile {
  key: string;
  label: string;
  kwhPerHour: number;
}

export const USAGE_PROFILES = {
  streaming4k: { key: "streaming4k", label: "Streaming 4K", kwhPerHour: 0.22 },
  streamingHd: { key: "streamingHd", label: "Streaming HD", kwhPerHour: 0.077 },
  washingMachine: {
    key: "washingMachine",
    label: "Machine à laver",
    kwhPerHour: 1.0,
  },
  gamingPc: { key: "gamingPc", label: "PC gaming", kwhPerHour: 0.4 },
  videoCall: { key: "videoCall", label: "Visioconférence", kwhPerHour: 0.15 },
} as const satisfies Record<string, UsageProfile>;

export type UsageKey = keyof typeof USAGE_PROFILES;
