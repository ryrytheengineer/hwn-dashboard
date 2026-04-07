"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type {
  ChecklistItem,
  ContentEntityKind,
  ContentItem,
  StageId,
} from "@/lib/content-types";
import {
  DEFAULT_CHECKLIST_TEMPLATES,
  isScheduledStage,
  STAGES,
} from "@/lib/content-types";
import {
  clearModalDraftCreate,
  clearModalDraftEdit,
  loadModalDraftCreate,
  loadModalDraftEdit,
  writeModalDraftCreate,
  writeModalDraftEdit,
} from "@/lib/modal-draft-storage";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial: ContentItem | null;
  onClose: () => void;
  onSave: (item: ContentItem) => void;
  onDelete?: (id: string) => void;
};

function newChecklistId(): string {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now());
}

function checklistFromTemplates(): ChecklistItem[] {
  return DEFAULT_CHECKLIST_TEMPLATES.map((text) => ({
    id: newChecklistId(),
    text,
    done: false,
  }));
}

function emptyItem(): ContentItem {
  return {
    id: "",
    entityKind: "person",
    founderName: "",
    jobTitle: "",
    stageId: STAGES[0].id,
    date: new Date().toISOString().slice(0, 10),
    filmTime: "",
    notes: "",
    checklist: checklistFromTemplates(),
  };
}

function buildInitialForm(mode: Mode, initial: ContentItem | null): ContentItem {
  if (mode === "edit" && initial) {
    const checklist =
      initial.checklist.length > 0
        ? initial.checklist.map((c) => ({ ...c }))
        : checklistFromTemplates();
    return {
      ...initial,
      checklist,
    };
  }
  return {
    ...emptyItem(),
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
  };
}

const inputClass =
  "hwn-focus-ring mt-2 w-full rounded-xl border border-white/15 bg-[var(--background)] px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500";

/** Valid value for controlled <input type="time" /> (HH:mm or empty). */
function timeInputValue(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return "";
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function FounderModal({
  mode,
  initial,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const titleId = useId();
  const [form, setForm] = useState<ContentItem>(() => {
    if (mode === "edit" && initial) {
      const draft = loadModalDraftEdit(initial.id);
      if (draft) return draft;
    }
    if (mode === "create") {
      const draft = loadModalDraftCreate();
      if (draft) return draft;
    }
    return buildInitialForm(mode, initial);
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (mode === "create") writeModalDraftCreate(form);
      else writeModalDraftEdit(form);
    }, 400);
    return () => window.clearTimeout(t);
  }, [form, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dateLabel =
    form.stageId === "film_planned"
      ? "Film date"
      : form.stageId === "remote_reel"
        ? "Target date"
        : "Updated";

  const timeLabel =
    form.stageId === "film_planned"
      ? "Film time"
      : form.stageId === "remote_reel"
        ? "Time (optional)"
        : "Time";

  const isPerson = form.entityKind === "person";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = form.founderName.trim();
    const title = form.jobTitle.trim();
    if (!name || !title) return;
    const checklist = form.checklist
      .map((c) => ({ ...c, text: c.text.trim() }))
      .filter((c) => c.text.length > 0);

    onSave({
      ...form,
      entityKind: form.entityKind,
      founderName: name,
      jobTitle: title,
      notes: form.notes.trim(),
      checklist,
    });
    if (mode === "create") clearModalDraftCreate();
    else clearModalDraftEdit(form.id);
    onClose();
  };

  const handleDelete = () => {
    if (mode === "edit" && initial && onDelete) {
      clearModalDraftEdit(initial.id);
      onDelete(initial.id);
      onClose();
    }
  };

  return (
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[var(--hwn-ink)]/35 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[var(--background)] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="h-1.5 w-full bg-[var(--hwn-accent)] shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]"
          aria-hidden
        />

        <div className="p-6 sm:p-7">
          <h2
            id={titleId}
            className="text-xl font-bold tracking-tight text-zinc-100"
          >
            {mode === "create" ? "Add" : "Edit"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            {mode === "create"
              ? "Choose person or product, then place them on the board. Your entries autosave as a draft on this device."
              : "Update details — changes save to this device when you tap Save changes. Edits autosave as a draft until then."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 sm:px-7 sm:pb-7">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Type
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["person", "product"] as ContentEntityKind[]).map((kind) => {
                const on = form.entityKind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, entityKind: kind }))}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                      on
                        ? "border-[var(--hwn-accent)] bg-[var(--hwn-accent)]/15 text-zinc-100 ring-2 ring-[var(--hwn-accent)]/25"
                        : "border-white/15 bg-[var(--background)] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                    }`}
                  >
                    {kind === "person" ? "Person" : "Product"}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="item-name"
              className="text-xs font-bold uppercase tracking-wider text-zinc-400"
            >
              {isPerson ? "Name" : "Product name"}
            </label>
            <input
              id="item-name"
              type="text"
              value={form.founderName}
              onChange={(e) =>
                setForm((f) => ({ ...f, founderName: e.target.value }))
              }
              className={inputClass}
              placeholder={
                isPerson ? "e.g. Alex Chen" : "e.g. Pro dock, Model X"
              }
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="job-title"
              className="text-xs font-bold uppercase tracking-wider text-zinc-400"
            >
              {isPerson ? "Job title" : "Category / type"}
            </label>
            <input
              id="job-title"
              type="text"
              value={form.jobTitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobTitle: e.target.value }))
              }
              className={inputClass}
              placeholder={
                isPerson
                  ? "e.g. CEO, Head of Marketing"
                  : "e.g. GPU, Dock, Accessory"
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="stage"
              className="text-xs font-bold uppercase tracking-wider text-zinc-400"
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
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="content-date"
                className="text-xs font-bold uppercase tracking-wider text-zinc-400"
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
                className={`${inputClass} hwn-datetime-input`}
              />
            </div>
            <div>
              <label
                htmlFor="film-time"
                className="text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                {timeLabel}
              </label>
              <input
                id="film-time"
                type="time"
                step={60}
                value={timeInputValue(form.filmTime)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, filmTime: e.target.value }))
                }
                className={`${inputClass} hwn-datetime-input`}
              />
              {!isScheduledStage(form.stageId) ? (
                <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">
                  Shown on the card for &quot;Film date planned&quot; and
                  &quot;Remote reel / TikTok&quot;.
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Checklist
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    checklist: [
                      ...f.checklist,
                      { id: newChecklistId(), text: "", done: false },
                    ],
                  }))
                }
                className="text-xs font-semibold text-[var(--hwn-accent)] hover:underline"
              >
                + Add item
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-2">
              {form.checklist.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-center text-xs text-zinc-500">
                  No tasks yet — add steps like “Script draft” or “Thumb
                  approved”.
                </li>
              ) : (
                form.checklist.map((task, index) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          checklist: f.checklist.map((c) =>
                            c.id === task.id ? { ...c, done: !c.done } : c
                          ),
                        }))
                      }
                      style={{ accentColor: "var(--hwn-accent)" }}
                      className="mt-2.5 h-4 w-4 shrink-0 rounded border-white/30 bg-[var(--background)] focus:ring-2 focus:ring-[var(--hwn-accent)]/35 focus:ring-offset-0"
                      aria-label={`Done: ${task.text || `task ${index + 1}`}`}
                    />
                    <input
                      type="text"
                      value={task.text}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          checklist: f.checklist.map((c) =>
                            c.id === task.id
                              ? { ...c, text: e.target.value }
                              : c
                          ),
                        }))
                      }
                      placeholder="Task description"
                      className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          checklist: f.checklist.filter((c) => c.id !== task.id),
                        }))
                      }
                      className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                      aria-label="Remove task"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="text-xs font-bold uppercase tracking-wider text-zinc-400"
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm font-semibold text-red-400 underline-offset-4 hover:text-red-300 hover:underline"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-[var(--background)] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/35 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="hwn-btn-primary rounded-full px-5 py-2.5 text-sm font-semibold transition"
              >
                {mode === "create" ? "Add" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
