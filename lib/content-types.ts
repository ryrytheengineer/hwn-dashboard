export type ContentType = "ugc" | "merchant";

export type StageId =
  | "emailed_rit"
  | "rit_reached_out"
  | "founder_agreed"
  | "no_reply"
  | "film_planned";

export type ContentItem = {
  id: string;
  founderName: string;
  type: ContentType;
  stageId: StageId;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  notes: string;
};

export const STAGES: readonly {
  id: StageId;
  title: string;
  dotClass: string;
  ringClass: string;
  stripeClass: string;
  columnTint: string;
}[] = [
  {
    id: "emailed_rit",
    title: "Emailed Rit",
    dotClass: "bg-blue-500",
    ringClass: "ring-blue-500/25",
    stripeClass: "border-l-blue-500",
    columnTint:
      "bg-gradient-to-b from-blue-500/[0.08] via-transparent to-transparent",
  },
  {
    id: "rit_reached_out",
    title: "Rit reached out to founder",
    dotClass: "bg-amber-500",
    ringClass: "ring-amber-500/25",
    stripeClass: "border-l-amber-500",
    columnTint:
      "bg-gradient-to-b from-amber-500/[0.09] via-transparent to-transparent",
  },
  {
    id: "founder_agreed",
    title: "Founder agreed",
    dotClass: "bg-green-500",
    ringClass: "ring-green-500/25",
    stripeClass: "border-l-green-500",
    columnTint:
      "bg-gradient-to-b from-green-500/[0.08] via-transparent to-transparent",
  },
  {
    id: "no_reply",
    title: "No reply / declined",
    dotClass: "bg-red-500",
    ringClass: "ring-red-500/25",
    stripeClass: "border-l-red-500",
    columnTint:
      "bg-gradient-to-b from-red-500/[0.07] via-transparent to-transparent",
  },
  {
    id: "film_planned",
    title: "Film date planned",
    dotClass: "bg-teal-500",
    ringClass: "ring-teal-500/25",
    stripeClass: "border-l-teal-500",
    columnTint:
      "bg-gradient-to-b from-teal-500/[0.09] via-transparent to-transparent",
  },
] as const;

export const FINAL_STAGE_ID: StageId = "film_planned";

export const TYPE_LABELS: Record<ContentType, string> = {
  ugc: "UGC Creator",
  merchant: "Merchant Asset",
};
