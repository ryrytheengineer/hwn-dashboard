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
      className={`relative flex h-full min-h-0 w-[148px] shrink-0 snap-center flex-col overflow-hidden rounded-lg border border-white/10 bg-[var(--background)] sm:w-[160px] md:w-[168px] lg:w-auto lg:min-w-0 lg:max-w-none lg:flex-1 lg:basis-0 ${
        isOver ? "ring-1 ring-white/25" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-16 ${stage.columnTint} lg:h-20`}
        aria-hidden
      />
      <div className="relative shrink-0 border-b border-white/10 bg-[var(--background)]/95 px-2 py-2 backdrop-blur-sm sm:px-2.5 sm:py-2.5">
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${stage.dotClass} ring-2 ${stage.ringClass} sm:h-2.5 sm:w-2.5 sm:ring-4`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-3 text-[11px] font-medium leading-tight text-zinc-200 sm:text-[12px] lg:text-[11px] xl:text-[12px]">
              {stage.title}
            </h2>
            <p className="mt-1 text-[10px] tabular-nums text-zinc-500 sm:text-[11px]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-1.5 sm:gap-2 sm:p-2">
        {children}
      </div>
    </section>
  );
}
