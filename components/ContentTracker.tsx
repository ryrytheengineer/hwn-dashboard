"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FounderModal } from "@/components/FounderModal";
import { useContentItems } from "@/hooks/useContentItems";
import type { ContentItem, ContentType, StageId } from "@/lib/content-types";
import {
  FINAL_STAGE_ID,
  STAGES,
  TYPE_LABELS,
} from "@/lib/content-types";

type Filter = "all" | ContentType;

const FILTER_TABS: { id: Filter; label: string; short: string }[] = [
  { id: "all", label: "All types", short: "All" },
  { id: "ugc", label: TYPE_LABELS.ugc, short: "UGC" },
  { id: "merchant", label: TYPE_LABELS.merchant, short: "Merchant" },
];

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

export function ContentTracker() {
  const { items, addItem, updateItem, removeItem } = useContentItems();
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [createNonce, setCreateNonce] = useState(0);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  const byStage = useMemo(() => {
    const map = new Map<StageId, ContentItem[]>();
    for (const s of STAGES) map.set(s.id, []);
    for (const item of filtered) {
      const list = map.get(item.stageId);
      if (list) list.push(item);
    }
    return map;
  }, [filtered]);

  const openCreate = () => {
    setCreateNonce((n) => n + 1);
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setModalMode("edit");
    setEditing(item);
    setModalOpen(true);
  };

  const handleSave = (item: ContentItem) => {
    if (modalMode === "create") addItem(item);
    else updateItem(item);
  };

  return (
    <div className="bg-app-grid flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1720px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold tracking-tight text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]">
              HN
            </div>
            <div>
              <p className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.65rem] sm:leading-tight">
                Hardware Nation
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-500">
                Content pipeline tracker
                <span className="mx-2 text-zinc-300">·</span>
                <span className="tabular-nums text-zinc-600">
                  {items.length}{" "}
                  {items.length === 1 ? "founder" : "founders"}
                  {filter !== "all" ? (
                    <>
                      {" "}
                      <span className="text-zinc-400">(</span>
                      {filtered.length} shown
                      <span className="text-zinc-400">)</span>
                    </>
                  ) : null}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div
              className="inline-flex w-fit rounded-full bg-zinc-200/70 p-1 ring-1 ring-zinc-900/5"
              role="tablist"
              aria-label="Filter by asset type"
            >
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 sm:text-sm ${
                      active
                        ? "bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-zinc-900/8"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                    title={tab.label}
                  >
                    <span className="sm:hidden">{tab.short}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <Link
              href="/news"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-950/[0.04] transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              News agent
            </Link>

            <button
              type="button"
              onClick={openCreate}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-base leading-none transition group-hover:bg-white/25">
                +
              </span>
              Add founder
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1720px] flex-1 flex-col px-4 py-6 sm:px-6">
          <div className="board-scroll flex min-h-[calc(100vh-12rem)] min-h-0 flex-1 gap-4 overflow-x-auto pb-3">
            {STAGES.map((stage) => {
              const columnItems = byStage.get(stage.id) ?? [];
              return (
                <section
                  key={stage.id}
                  className="relative flex w-[min(92vw,300px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.04] backdrop-blur-sm"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-24 ${stage.columnTint}`}
                    aria-hidden
                  />
                  <div className="relative border-b border-zinc-100 bg-white/90 px-3.5 py-3.5 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${stage.dotClass} ring-4 ${stage.ringClass}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-[family-name:var(--font-syne)] text-[0.8125rem] font-bold leading-snug tracking-tight text-zinc-900">
                          {stage.title}
                        </h2>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums tracking-wide text-zinc-600">
                            {columnItems.length}
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                            {columnItems.length === 1 ? "card" : "cards"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex min-h-[220px] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
                    {columnItems.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300/70 bg-zinc-50/50 px-4 py-10 text-center">
                        <p className="text-xs font-medium text-zinc-400">
                          Nothing here yet
                        </p>
                        <p className="mt-1 max-w-[12rem] text-[11px] leading-relaxed text-zinc-400">
                          Move someone in via the card editor, or tap{" "}
                          <span className="font-semibold text-zinc-500">
                            Add founder
                          </span>
                        </p>
                      </div>
                    ) : (
                      columnItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openEdit(item)}
                          className={`group relative w-full overflow-hidden rounded-xl border border-zinc-200/90 border-l-[3px] ${stage.stripeClass} bg-white px-3 py-3 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.14)] active:translate-y-0`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-[family-name:var(--font-syne)] text-[0.9375rem] font-bold leading-snug tracking-tight text-zinc-900">
                              {item.founderName}
                            </span>
                            <span
                              className={
                                item.type === "ugc"
                                  ? "shrink-0 rounded-lg bg-gradient-to-b from-orange-50 to-orange-100/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-950 ring-1 ring-orange-200/80"
                                  : "shrink-0 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-950 ring-1 ring-blue-200/80"
                              }
                            >
                              {TYPE_LABELS[item.type]}
                            </span>
                          </div>
                          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                              {item.stageId === FINAL_STAGE_ID
                                ? "Film date"
                                : "Updated"}
                            </span>
                            <span className="tabular-nums text-zinc-500">
                              {formatDisplayDate(item.date)}
                            </span>
                          </p>
                          {item.notes ? (
                            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-zinc-600">
                              {item.notes}
                            </p>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <FounderModal
          key={
            modalMode === "edit" && editing
              ? `edit-${editing.id}`
              : `create-${createNonce}`
          }
          mode={modalMode}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onDelete={modalMode === "edit" ? removeItem : undefined}
        />
      ) : null}
    </div>
  );
}
