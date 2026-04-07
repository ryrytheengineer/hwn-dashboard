import { normalizeContentItem } from "@/lib/content-normalize";
import type { ContentItem } from "@/lib/content-types";

const CREATE_KEY = "hwn-modal-draft-create-v1";

export function editDraftStorageKey(id: string): string {
  return `hwn-modal-draft-edit-${id}-v1`;
}

export function loadModalDraftCreate(): ContentItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CREATE_KEY);
    if (!raw) return null;
    return normalizeContentItem(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function loadModalDraftEdit(itemId: string): ContentItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(editDraftStorageKey(itemId));
    if (!raw) return null;
    const item = normalizeContentItem(JSON.parse(raw) as unknown);
    return item && item.id === itemId ? item : null;
  } catch {
    return null;
  }
}

export function writeModalDraftCreate(form: ContentItem): void {
  try {
    localStorage.setItem(CREATE_KEY, JSON.stringify(form));
  } catch {
    /* quota */
  }
}

export function writeModalDraftEdit(form: ContentItem): void {
  try {
    localStorage.setItem(editDraftStorageKey(form.id), JSON.stringify(form));
  } catch {
    /* quota */
  }
}

export function clearModalDraftCreate(): void {
  try {
    localStorage.removeItem(CREATE_KEY);
  } catch {
    /* */
  }
}

export function clearModalDraftEdit(itemId: string): void {
  try {
    localStorage.removeItem(editDraftStorageKey(itemId));
  } catch {
    /* */
  }
}
