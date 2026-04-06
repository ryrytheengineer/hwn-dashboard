export type StageId =
  | "emailed_rit"
  | "rit_reached_out"
  | "founder_agreed"
  | "remote_reel"
  | "no_reply"
  | "film_planned";

export type ContentEntityKind = "person" | "product";

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

/** Pre-filled tasks for every new card (all start unchecked). */
export const DEFAULT_CHECKLIST_TEMPLATES = [
  "Script",
  "Date planned",
  "B-roll / assets",
  "Thumbnail",
  "Title & description",
] as const;

export type ContentItem = {
  id: string;
  /** Person or product row */
  entityKind: ContentEntityKind;
  /** Display name (person or product name) */
  founderName: string;
  /** Role for people, category/type for products */
  jobTitle: string;
  stageId: StageId;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Local time of filming (HH:mm), used when stage is film planned */
  filmTime: string;
  notes: string;
  /** Optional task list for this card */
  checklist: ChecklistItem[];
};

export const STAGES: readonly {
  id: StageId;
  title: string;
  /** Short label for funnel summary */
  shortLabel: string;
  dotClass: string;
  ringClass: string;
  stripeClass: string;
  columnTint: string;
}[] = [
  {
    id: "emailed_rit",
    title: "Emailed Rit",
    shortLabel: "Emailed",
    dotClass: "bg-[#dfff00]",
    ringClass: "ring-[#dfff00]/35",
    stripeClass: "border-l-[#dfff00]",
    columnTint:
      "bg-gradient-to-b from-[#dfff00]/[0.2] via-transparent to-transparent",
  },
  {
    id: "rit_reached_out",
    title: "Rit reached out to founder",
    shortLabel: "Rit",
    dotClass: "bg-[#c4e807]",
    ringClass: "ring-[#c4e807]/35",
    stripeClass: "border-l-[#c4e807]",
    columnTint:
      "bg-gradient-to-b from-[#c4e807]/[0.22] via-transparent to-transparent",
  },
  {
    id: "founder_agreed",
    title: "Founder agreed",
    shortLabel: "Agreed",
    dotClass: "bg-[#9fcc00]",
    ringClass: "ring-[#9fcc00]/35",
    stripeClass: "border-l-[#9fcc00]",
    columnTint:
      "bg-gradient-to-b from-[#9fcc00]/[0.2] via-transparent to-transparent",
  },
  {
    id: "remote_reel",
    title: "Remote reel / TikTok",
    shortLabel: "Remote",
    dotClass: "bg-cyan-400",
    ringClass: "ring-cyan-400/35",
    stripeClass: "border-l-cyan-400",
    columnTint:
      "bg-gradient-to-b from-cyan-400/[0.14] via-transparent to-transparent",
  },
  {
    id: "no_reply",
    title: "No reply / declined",
    shortLabel: "Declined",
    dotClass: "bg-red-600",
    ringClass: "ring-red-600/30",
    stripeClass: "border-l-red-600",
    columnTint:
      "bg-gradient-to-b from-red-500/[0.12] via-transparent to-transparent",
  },
  {
    id: "film_planned",
    title: "Film date planned",
    shortLabel: "Film",
    dotClass: "bg-[#bfff3a]",
    ringClass: "ring-[#bfff3a]/40",
    stripeClass: "border-l-[#bfff3a]",
    columnTint:
      "bg-gradient-to-b from-[#bfff3a]/[0.2] via-transparent to-transparent",
  },
] as const;

/** On-location or founder shoot — last column in the outreach track. */
export const FINAL_STAGE_ID: StageId = "film_planned";

/** Stages that use target date + optional time (strip, sorting, card “Scheduled”). */
export function isScheduledStage(stageId: StageId): boolean {
  return stageId === "film_planned" || stageId === "remote_reel";
}
