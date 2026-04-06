"use client";

import { useCallback, useSyncExternalStore } from "react";
import { normalizeContentItem } from "@/lib/content-normalize";
import type { ContentItem } from "@/lib/content-types";

const STORAGE_KEY = "hardware-nation-content-tracker-v1";

let cache: ContentItem[] | null = null;
const listeners = new Set<() => void>();

function loadFromStorage(): ContentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeContentItem)
      .filter((x): x is ContentItem => x !== null);
  } catch {
    return [];
  }
}

function getSnapshot(): ContentItem[] {
  if (typeof window === "undefined") return [];
  if (cache === null) {
    cache = loadFromStorage();
  }
  return cache;
}

function getServerSnapshot(): ContentItem[] {
  return [];
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      onChange();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function persist(next: ContentItem[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode */
  }
  listeners.forEach((l) => l());
}

export function useContentItems() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: ContentItem) => {
    persist([...getSnapshot(), item]);
  }, []);

  const updateItem = useCallback((item: ContentItem) => {
    persist(getSnapshot().map((x) => (x.id === item.id ? item : x)));
  }, []);

  const removeItem = useCallback((id: string) => {
    persist(getSnapshot().filter((x) => x.id !== id));
  }, []);

  const replaceAllItems = useCallback((next: ContentItem[]) => {
    persist(next);
  }, []);

  return { items, addItem, updateItem, removeItem, replaceAllItems };
}
