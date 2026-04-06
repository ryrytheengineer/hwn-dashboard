"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type { ContentItem, ContentType, StageId } from "@/lib/content-types";
import {
  FINAL_STAGE_ID,
  STAGES,
  TYPE_LABELS,
} from "@/lib/content-types";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial: ContentItem | null;
  onClose: () => void;
  onSave: (item: ContentItem) => void;
  onDelete?: (id: string) => void;
};

function emptyItem(): ContentItem {
  return {
    id: "",
    founderName: "",
    type: "ugc",
    stageId: STAGES[0].id,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function buildInitialForm(mode: Mode, initial: ContentItem | null): ContentItem {
  if (mode === "edit" && initial) {
    return { ...initial };
  }
  return {
    ...emptyItem(),
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
  };
}

const inputClass =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/[0.06]";

export function FounderModal({
  mode,
  initial,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const titleId = useId();
  const [form, setForm] = useState<ContentItem>(() =>
    buildInitialForm(mode, initial)
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dateLabel =
    form.stageId === FINAL_STAGE_ID ? "Film date" : "Updated";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = form.founderName.trim();
    if (!name) return;
    onSave({
      ...form,
      founderName: name,
      notes: form.notes.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (mode === "edit" && initial && onDelete) {
      onDelete(initial.id);
      onClose();
    }
  };

  return (
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_24px_64px_-24px_rgba(0,0,0,0.28)] ring-1 ring-zinc-950/[0.06]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="h-1 w-full bg-gradient-to-r from-blue-500 via-teal-500 to-amber-500"
          aria-hidden
        />

        <div className="p-6 sm:p-7">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-zinc-900"
          >
            {mode === "create" ? "Add founder" : "Edit founder"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
            {mode === "create"
              ? "Log a new contact and pick where they sit in the flow."
              : "Update details — changes save to this device instantly."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 sm:px-7 sm:pb-7">
          <div>
            <label
              htmlFor="founder-name"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Founder / brand name
            </label>
            <input
              id="founder-name"
              type="text"
              value={form.founderName}
              onChange={(e) =>
                setForm((f) => ({ ...f, founderName: e.target.value }))
              }
              className={inputClass}
              placeholder="e.g. Alex @ Acme"
              required
              autoFocus
            />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Asset type
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["ugc", "merchant"] as ContentType[]).map((t) => {
                const on = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                      on
                        ? t === "ugc"
                          ? "border-orange-200 bg-orange-50/80 text-orange-950 ring-2 ring-orange-500/20"
                          : "border-blue-200 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20"
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="stage"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Stage
            </label>
            <select
              id="stage"
              value={form.stageId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  stageId: e.target.value as StageId,
                }))
              }
              className={`${inputClass} cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="content-date"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              {dateLabel}
            </label>
            <input
              id="content-date"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Context, next steps, slack links…"
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm font-semibold text-red-600 underline-offset-4 hover:text-red-700 hover:underline"
              >
                Delete founder
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition hover:bg-zinc-800"
              >
                {mode === "create" ? "Add to board" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
