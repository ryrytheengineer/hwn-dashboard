"use client";



import { useCallback, useSyncExternalStore } from "react";

import type { ContentItem, ContentType, StageId } from "@/lib/content-types";

import { STAGES } from "@/lib/content-types";



const STORAGE_KEY = "hardware-nation-content-tracker-v1";



const STAGE_IDS = new Set<string>(STAGES.map((s) => s.id));



function normalizeItem(raw: unknown): ContentItem | null {

  if (!raw || typeof raw !== "object") return null;

  const o = raw as Record<string, unknown>;

  if (typeof o.id !== "string") return null;



  let founderName = "";

  if (typeof o.founderName === "string") founderName = o.founderName;

  else if (typeof o.creatorName === "string") founderName = o.creatorName;



  const type =

    o.type === "ugc" || o.type === "merchant" ? (o.type as ContentType) : null;

  if (!type) return null;



  const stageId =

    typeof o.stageId === "string" && STAGE_IDS.has(o.stageId)

      ? (o.stageId as StageId)

      : null;

  if (!stageId) return null;



  const date = typeof o.date === "string" ? o.date : "";

  const notes = typeof o.notes === "string" ? o.notes : "";



  return { id: o.id, founderName, type, stageId, date, notes };

}



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

      .map(normalizeItem)

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



  return { items, addItem, updateItem, removeItem };

}


