"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ChecklistItem, ContentItem } from "@/lib/content-types";
import { isScheduledStage, STAGES } from "@/lib/content-types";
import { filmSoonKind } from "@/lib/pipeline-utils";

type StageConfig = (typeof STAGES)[number];

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDisplayFilmTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return hhmm;
  const d = new Date(2000, 0, 1, h, min);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function checklistProgress(checklist: ChecklistItem[]): {
  done: number;
  total: number;
} | null {
  const total = checklist.length;
  if (total === 0) return null;
  const done = checklist.filter((c) => c.done).length;
  return { done, total };
}

type Props = {
  item: ContentItem;
  stage: StageConfig;
  compact: boolean;
  onOpen: (item: ContentItem) => void;
};

export function PipelineKanbanCard({ item, stage, compact, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: { item },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const soon = filmSoonKind(item);
  const pad = compact ? "px-2 py-2" : "px-3 py-3";
  const titleCls = compact ? "text-[0.8125rem]" : "text-[0.9375rem]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-0 rounded-lg border border-white/10 border-l-2 ${stage.stripeClass} bg-[var(--background)] transition duration-200 ${
        isDragging ? "z-20 opacity-50 ring-1 ring-white/20" : ""
      }`}
    >
      <button
        type="button"
        className="touch-none shrink-0 cursor-grab rounded-l-[7px] border-r border-white/10 bg-white/[0.03] px-2 py-2.5 text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-400 active:cursor-grabbing"
        aria-label="Move to another stage"
        {...listeners}
        {...attributes}
      >
        <span
          className="flex flex-col gap-0.5 opacity-70"
          aria-hidden
        >
          <span className="h-px w-3 rounded-full bg-current" />
          <span className="h-px w-3 rounded-full bg-current" />
          <span className="h-px w-3 rounded-full bg-current" />
        </span>
      </button>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={`min-w-0 flex-1 overflow-hidden rounded-r-[7px] text-left transition hover:bg-white/[0.03] ${pad}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span
              className={`text-zinc-500 ${
                compact ? "text-[10px]" : "text-[11px]"
              }`}
            >
              {item.entityKind === "person" ? "Person" : "Product"}
            </span>
            <span
              className={`mt-0.5 block font-semibold leading-snug tracking-tight text-zinc-100 ${titleCls}`}
            >
              {item.founderName}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {soon === "soon" ? (
              <span className="text-[10px] text-amber-200/90">Due soon</span>
            ) : null}
            {soon === "past" ? (
              <span className="text-[10px] text-zinc-600">Past</span>
            ) : null}
            {item.jobTitle.trim() ? (
              <span
                className={`max-w-[10rem] truncate rounded border border-white/10 bg-white/[0.04] text-zinc-300 ${
                  compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
                }`}
              >
                {item.jobTitle.trim()}
              </span>
            ) : null}
          </div>
        </div>
        <p
          className={`mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-zinc-500 ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          <span className="text-zinc-600">
            {isScheduledStage(item.stageId) ? "Scheduled" : "Updated"}
          </span>
          <span className="tabular-nums text-zinc-400">
            {formatDisplayDate(item.date)}
            {isScheduledStage(item.stageId) && item.filmTime.trim()
              ? ` · ${formatDisplayFilmTime(item.filmTime)}`
              : ""}
          </span>
        </p>
        {(() => {
          const prog = checklistProgress(item.checklist);
          if (!prog) return null;
          const pct = Math.round((prog.done / prog.total) * 100);
          return (
            <div className={compact ? "mt-1.5" : "mt-2"}>
              <div
                className={`flex items-center justify-between gap-2 text-zinc-600 ${
                  compact ? "text-[10px]" : "text-[11px]"
                }`}
              >
                <span>Tasks</span>
                <span className="tabular-nums text-zinc-500">
                  {prog.done}/{prog.total}
                </span>
              </div>
              <div
                className={`mt-1 h-0.5 overflow-hidden rounded-full bg-white/10 ${
                  compact ? "h-px" : ""
                }`}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Tasks ${prog.done} of ${prog.total}`}
              >
                <div
                  className="h-full rounded-full bg-zinc-400/80 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}
        {item.notes ? (
          <p
            className={`mt-2 line-clamp-3 leading-relaxed text-zinc-500 ${
              compact ? "text-xs" : "text-[13px]"
            }`}
          >
            {item.notes}
          </p>
        ) : null}
      </button>
    </div>
  );
}

export function PipelineKanbanCardPreview({
  item,
  stage,
}: {
  item: ContentItem;
  stage: StageConfig;
}) {
  return (
    <div
      className={`pointer-events-none w-[min(88vw,220px)] rounded-lg border border-white/10 border-l-2 ${stage.stripeClass} bg-[var(--background)] px-2.5 py-2 shadow-lg ring-1 ring-white/10 sm:w-[min(90vw,260px)]`}
    >
      <p className="text-sm font-semibold text-zinc-100">
        {item.founderName}
      </p>
      {item.jobTitle.trim() ? (
        <p className="mt-0.5 text-xs text-zinc-500">{item.jobTitle}</p>
      ) : null}
    </div>
  );
}
