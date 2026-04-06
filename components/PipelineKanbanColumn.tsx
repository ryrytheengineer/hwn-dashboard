"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { STAGES } from "@/lib/content-types";

type StageConfig = (typeof STAGES)[number];

type Props = {
  stage: StageConfig;
  itemCount: number;
  children: ReactNode;
};

export function PipelineKanbanColumn({
  stage,
  itemCount,
  children,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <section
      ref={setNodeRef}
      className={`relative flex w-[min(92vw,300px)] shrink-0 snap-center flex-col overflow-hidden rounded-lg border border-white/10 bg-[var(--background)] md:snap-none ${
        isOver ? "ring-1 ring-white/25" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 ${stage.columnTint}`}
        aria-hidden
      />
      <div className="relative border-b border-white/10 bg-[var(--background)]/95 px-3.5 py-3.5 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${stage.dotClass} ring-4 ${stage.ringClass}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-medium leading-snug text-zinc-200">
              {stage.title}
            </h2>
            <p className="mt-2 text-[11px] tabular-nums text-zinc-500">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[220px] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
        {children}
      </div>
    </section>
  );
}
