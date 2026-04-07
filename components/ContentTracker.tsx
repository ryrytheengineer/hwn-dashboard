"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FounderModal } from "@/components/FounderModal";
import {
  PipelineKanbanCard,
  PipelineKanbanCardPreview,
} from "@/components/PipelineKanbanCard";
import { PipelineKanbanColumn } from "@/components/PipelineKanbanColumn";
import { useContentItems } from "@/hooks/useContentItems";
import { parsePipelineImportJson } from "@/lib/content-normalize";
import type { ContentItem, StageId } from "@/lib/content-types";
import { isScheduledStage, STAGES } from "@/lib/content-types";
import {
  readPipelineCompact,
  readPipelineSearch,
  writePipelineCompact,
  writePipelineSearch,
} from "@/lib/pipeline-ui-storage";
import {
  compareFilmOrder,
  filterItemsBySearch,
  upcomingFilms,
} from "@/lib/pipeline-utils";

const STAGE_ID_SET = new Set<string>(STAGES.map((s) => s.id));

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

function formatShortFilmLine(item: ContentItem): string {
  if (!item.date?.trim()) return item.founderName;
  const d = new Date(item.date + "T12:00:00");
  const dateStr = Number.isNaN(d.getTime())
    ? item.date
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
  const t = item.filmTime?.trim();
  return t ? `${item.founderName} · ${dateStr} ${t}` : `${item.founderName} · ${dateStr}`;
}

export function ContentTracker() {
  const { items, addItem, updateItem, removeItem, replaceAllItems } =
    useContentItems();
  const [search, setSearch] = useState(readPipelineSearch);
  const [compact, setCompact] = useState(readPipelineCompact);

  useEffect(() => {
    writePipelineSearch(search);
  }, [search]);

  useEffect(() => {
    writePipelineCompact(compact);
  }, [compact]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [createNonce, setCreateNonce] = useState(0);
  const [activeDragItem, setActiveDragItem] = useState<ContentItem | null>(
    null
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filtered = useMemo(
    () => filterItemsBySearch(items, search),
    [items, search]
  );

  const byStage = useMemo(() => {
    const map = new Map<StageId, ContentItem[]>();
    for (const s of STAGES) map.set(s.id, []);
    for (const item of filtered) {
      const list = map.get(item.stageId);
      if (list) list.push(item);
    }
    return map;
  }, [filtered]);

  const upcoming = useMemo(
    () => upcomingFilms(filtered, 4),
    [filtered]
  );

  const openCreate = useCallback(() => {
    setCreateNonce((n) => n + 1);
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item: ContentItem) => {
    setModalMode("edit");
    setEditing(item);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === "a" || e.key === "A") {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        openCreate();
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, openCreate]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const item = items.find((i) => i.id === id) ?? null;
      setActiveDragItem(item);
    },
    [items]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragItem(null);
      const { active, over } = event;
      if (!over) return;
      const overId = String(over.id);
      if (!STAGE_ID_SET.has(overId)) return;
      const itemId = String(active.id);
      const item = items.find((i) => i.id === itemId);
      if (!item || item.stageId === overId) return;
      updateItem({ ...item, stageId: overId as StageId });
    },
    [items, updateItem]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragItem(null);
  }, []);

  const handleSave = (item: ContentItem) => {
    if (modalMode === "create") addItem(item);
    else updateItem(item);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `hardware-nation-pipeline-${d}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const next = parsePipelineImportJson(parsed);
      if (!next || next.length === 0) {
        window.alert("No valid records in file.");
        return;
      }
      const ok = window.confirm(
        `Replace ${items.length} items with ${next.length} from file?`
      );
      if (ok) replaceAllItems(next);
    } catch {
      window.alert("Import failed.");
    }
  };

  const activeStage = activeDragItem
    ? STAGES.find((s) => s.id === activeDragItem.stageId) ?? STAGES[0]
    : STAGES[0];

  return (
    <div className="bg-app-grid flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <header className="z-40 shrink-0 border-b border-white/10 bg-[var(--background)]/92 px-3 py-3 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex w-full min-w-0 flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-start gap-3 sm:gap-4">
              <Link
                href="/"
                className="flex h-9 shrink-0 items-stretch sm:h-10"
                aria-label="Hardware Nation home"
              >
                <Image
                  src="/hwn-logo.png"
                  alt="Hardware Nation"
                  width={36}
                  height={44}
                  className="h-9 w-auto max-w-[38px] object-contain object-left sm:h-10 sm:max-w-[40px]"
                  priority
                />
              </Link>
              <div className="min-w-0">
                <p className="text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">
                  Hardware Nation
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-zinc-500 sm:text-sm">
                  Pipeline
                  <span className="text-zinc-700"> · </span>
                  <span className="text-zinc-400">{items.length} items</span>
                  {search.trim() ? (
                    <>
                      <span className="text-zinc-700"> · </span>
                      <span>{filtered.length} shown</span>
                    </>
                  ) : null}
                </p>
                <p className="mt-1 text-[10px] font-normal tabular-nums tracking-normal text-zinc-500 sm:text-[11px]">
                  {STAGES.map((s, i) => (
                    <span key={s.id}>
                      {i > 0 ? <span className="text-zinc-700"> · </span> : null}
                      {s.shortLabel}{" "}
                      <span className="text-zinc-400">
                        {byStage.get(s.id)?.length ?? 0}
                      </span>
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Link
                href="/news"
                className="inline-flex items-center justify-center rounded-lg border border-white/12 bg-[var(--background)] px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition hover:border-white/20 hover:text-zinc-100 sm:px-4 sm:py-2 sm:text-[13px]"
              >
                News
              </Link>
              <Link
                href="/launches"
                className="inline-flex items-center justify-center rounded-lg border border-white/12 bg-[var(--background)] px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition hover:border-white/20 hover:text-zinc-100 sm:px-4 sm:py-2 sm:text-[13px]"
              >
                Launches
              </Link>
              <button
                type="button"
                onClick={openCreate}
                title="New item (A)"
                className="hwn-btn-primary inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[12px] font-medium transition active:scale-[0.99] sm:px-4 sm:py-2 sm:text-[13px]"
              >
                New
              </button>
            </div>
          </div>

          {upcoming.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2">
              <p className="text-[11px] text-zinc-500">Scheduled</p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-left text-[11px] text-zinc-300 transition hover:text-zinc-100 sm:text-[12px]"
                    >
                      {formatShortFilmLine(item)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="sr-only" htmlFor="pipeline-search">
              Search
            </label>
            <input
              ref={searchRef}
              id="pipeline-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="hwn-focus-ring min-h-9 w-full min-w-0 flex-1 rounded-lg border border-white/12 bg-[var(--background)] px-2.5 py-1.5 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 sm:min-h-10 sm:min-w-[12rem] sm:px-3 sm:py-2 sm:text-[13px] sm:max-w-sm"
              autoComplete="off"
            />
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setCompact((c) => !c)}
                className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition sm:px-3 sm:py-2 sm:text-[13px] ${
                  compact
                    ? "border-white/20 bg-white/[0.06] text-zinc-200"
                    : "border-white/10 bg-transparent text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={exportJson}
                title="Download JSON backup"
                className="rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 transition hover:border-white/15 hover:text-zinc-300 sm:px-3 sm:py-2 sm:text-[13px]"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                title="Replace board from JSON file"
                className="rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 transition hover:border-white/15 hover:text-zinc-300 sm:px-3 sm:py-2 sm:text-[13px]"
              >
                Import
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onImportPick}
              />
            </div>
          </div>

          <p className="hidden text-[10px] leading-snug text-zinc-600 lg:block">
            A new item · / search · drag to move · Esc closes dialog
          </p>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full min-w-0 flex-1 flex-col px-2 py-2 sm:px-3 sm:py-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="board-scroll flex min-h-0 flex-1 snap-x snap-mandatory flex-row gap-1.5 overflow-x-auto overflow-y-hidden pb-1 sm:gap-2 lg:overflow-x-hidden">
              {STAGES.map((stage) => {
                const rawList = byStage.get(stage.id) ?? [];
                const list = isScheduledStage(stage.id)
                  ? [...rawList].sort(compareFilmOrder)
                  : rawList;
                return (
                  <PipelineKanbanColumn
                    key={stage.id}
                    stage={stage}
                    itemCount={list.length}
                  >
                    {list.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-transparent px-2 py-6 text-center">
                        <p className="text-[11px] text-zinc-500 sm:text-[12px]">Empty</p>
                        <p className="mt-1 max-w-[9rem] text-[10px] leading-relaxed text-zinc-600 sm:max-w-[14rem] sm:text-xs">
                          Drop from the handle or set stage in the editor.
                        </p>
                      </div>
                    ) : (
                      list.map((item) => (
                        <PipelineKanbanCard
                          key={item.id}
                          item={item}
                          stage={stage}
                          compact={compact}
                          onOpen={openEdit}
                        />
                      ))
                    )}
                  </PipelineKanbanColumn>
                );
              })}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeDragItem ? (
                  <PipelineKanbanCardPreview
                    item={activeDragItem}
                    stage={activeStage}
                  />
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
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
