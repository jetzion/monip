import type { TrainingType } from "../schedule";
import type { Place } from "./bookings";

/** Plan presets: how strongly to favour in-person training against cost and travel. */
export type Preset = "balanced" | "lowerCost" | "moreInPerson";

export const PRESETS: { value: Preset; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "lowerCost", label: "Lower cost" },
  { value: "moreInPerson", label: "More in-person" },
];

/** A cruise from the Cruise Fleet Schedule, as the planner needs it. */
export type PlanSailing = {
  id: number;
  ship: string;
  cruiseLine: string;
  startDate: string;
  endDate: string | null;
  startPort: string | null;
  endPort: string | null;
  arrival: string | null;
  departure: string | null;
};

export type PlanTrainer = {
  id: number;
  name: string;
  /** Start port name of the trainer's home base. */
  homeBase: string | null;
  canJoinCruises: boolean;
  maxDaysPerMonth: number | null;
};

/** A session already in the Training Schedule. */
export type PlanSession = {
  id: number;
  trainerId: number;
  ship: string;
  type: TrainingType;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  fixed: boolean;
  /** Ports of in-person sessions, for travel time; null when unknown. */
  startPort: string | null;
  endPort: string | null;
};

/** Estimated costs in USD; null while unknown. */
export type PlanCosts = {
  onlineSession: number | null;
  departureDaySession: number | null;
  onboardingDay: number | null;
  trip: number | null;
  night: number | null;
};

/** Admin rules for a plan, typed or produced by the AI from an instruction. Dates are "YYYY-MM-DD", inclusive. */
export type PlanRules = {
  /** No training on these days: one trainer, or everyone when trainerId is null. */
  unavailable: { trainerId: number | null; from: string; to: string }[];
  /** A training type not used, on these days or (without dates) at all. */
  blockedTypes: { type: TrainingType; from: string | null; to: string | null }[];
  /** Keep a trainer away from a port, or prefer them there (in-person training). */
  trainerPorts: { trainerId: number; port: string; mode: "avoid" | "prefer" }[];
  /** Ships left out of the plan. */
  excludeShips: string[];
};

export const NO_RULES: PlanRules = { unavailable: [], blockedTypes: [], trainerPorts: [], excludeShips: [] };

export type PlanSettings = {
  /** First and last cruise start day of the range, "YYYY-MM-DD". */
  from: string;
  to: string;
  preset: Preset;
  /** Only these ships; all eligible ships when empty. */
  ships: string[];
  /** Only cruises starting from these ports; all ports when empty. */
  ports: string[];
  /** Only these trainers (ids); all trainers when empty. */
  trainers: number[];
  /** Planned first, in this order. */
  priorityShips: string[];
  onlineHours: 2 | 4 | 8;
  /** Longer cruises are not offered for onboarding. */
  maxOnboardingNights: number;
  /** Nothing is proposed or moved before this instant (ISO). */
  now: string;
  rules: PlanRules;
};

export type PlanInput = {
  settings: PlanSettings;
  sailings: PlanSailing[];
  trainers: PlanTrainer[];
  sessions: PlanSession[];
  /** Start port name to IANA time zone. */
  portZones: Record<string, string>;
  costs: PlanCosts;
};

/** Fields the Training Schedule form sends to create the session. */
export type SessionFields = {
  cruise: number;
  trainer: number;
  type: TrainingType;
  date?: string;
  startTime?: string;
  timeZone?: string;
  durationHours?: "2" | "4" | "8";
};

/** A place a trainer could train a ship. */
export type Slot = {
  sailing: PlanSailing;
  trainerId: number;
  type: TrainingType;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  fields: SessionFields;
  /** Where the trainer must be; null for online. */
  place: Place | null;
  /** In person away from the trainer's home base. */
  travel: boolean;
  trips: number;
  nights: number;
  /** Null when a cost it needs is unknown. */
  cost: number | null;
  score: number;
};

export type Proposal = Slot & { reason: string };

export type Move = { session: PlanSession; to: Slot; reason: string };

export type Unscheduled = { ship: string; reason: string };

export type TrainerLoad = { trainerId: number; name: string; month: string; days: number; limit: number | null };

export type PlanSummary = {
  sessions: Record<TrainingType, number>;
  shipsCovered: number;
  shipsEligible: number;
  trips: number;
  nights: number;
  /** Null when any proposal's cost is unknown. */
  cost: number | null;
  load: TrainerLoad[];
};

export type Plan = {
  proposals: Proposal[];
  moves: Move[];
  unscheduled: Unscheduled[];
  /** Ships with cruises in the range that cannot be planned, and why. */
  skipped: Unscheduled[];
  summary: PlanSummary;
};
