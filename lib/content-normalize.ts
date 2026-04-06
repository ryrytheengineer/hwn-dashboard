import type {
  ChecklistItem,
  ContentEntityKind,
  ContentItem,
  StageId,
} from "@/lib/content-types";
import { STAGES } from "@/lib/content-types";

const STAGE_IDS = new Set<string>(STAGES.map((s) => s.id));

const LEGACY_TYPE_LABELS: Record<string, string> = {
  ugc: "UGC Creator",
  merchant: "Merchant Asset",
};

export function normalizeContentItem(raw: unknown): ContentItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string") return null;

  let founderName = "";
  if (typeof o.founderName === "string") founderName = o.founderName;
  else if (typeof o.creatorName === "string") founderName = o.creatorName;

  let jobTitle = "";
  if (typeof o.jobTitle === "string") jobTitle = o.jobTitle.trim();
  else if (o.type === "ugc" || o.type === "merchant") {
    const legacy = LEGACY_TYPE_LABELS[o.type as string];
    if (legacy) jobTitle = legacy;
  }

  const entityKind: ContentEntityKind =
    o.entityKind === "product" || o.entityKind === "person"
      ? o.entityKind
      : "person";

  const stageId =
    typeof o.stageId === "string" && STAGE_IDS.has(o.stageId)
      ? (o.stageId as StageId)
      : null;
  if (!stageId) return null;

  const date = typeof o.date === "string" ? o.date : "";
  const filmTime =
    typeof o.filmTime === "string" ? o.filmTime.slice(0, 5) : "";
  const notes = typeof o.notes === "string" ? o.notes : "";

  const checklist: ChecklistItem[] = [];
  if (Array.isArray(o.checklist)) {
    for (const row of o.checklist) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string") continue;
      const text = typeof r.text === "string" ? r.text : "";
      checklist.push({
        id: r.id,
        text,
        done: r.done === true,
      });
    }
  }

  return {
    id: o.id,
    entityKind,
    founderName,
    jobTitle,
    stageId,
    date,
    filmTime,
    notes,
    checklist,
  };
}

export function parsePipelineImportJson(raw: unknown): ContentItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ContentItem[] = [];
  for (const row of raw) {
    const item = normalizeContentItem(row);
    if (item) out.push(item);
  }
  return out;
}
