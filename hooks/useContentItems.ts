"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentItem } from "@/lib/content-types";

async function saveShared(next: ContentItem[]): Promise<void> {
  await fetch("/api/pipeline", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(next),
    cache: "no-store",
  });
}

export function useContentItems() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const itemsRef = useRef<ContentItem[]>([]);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/pipeline", { cache: "no-store" });
        const data = (await res.json()) as { items?: ContentItem[] };
        if (cancelled) return;
        const next = Array.isArray(data.items) ? data.items : [];
        itemsRef.current = next;
        setItems(next);
        isLoadedRef.current = true;
      } catch {
        if (!cancelled) isLoadedRef.current = true;
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: ContentItem[]) => {
    itemsRef.current = next;
    setItems(next);
    if (isLoadedRef.current) {
      void saveShared(next);
    }
  }, []);

  const addItem = useCallback(
    (item: ContentItem) => {
      commit([...itemsRef.current, item]);
    },
    [commit]
  );

  const updateItem = useCallback(
    (item: ContentItem) => {
      commit(itemsRef.current.map((x) => (x.id === item.id ? item : x)));
    },
    [commit]
  );

  const removeItem = useCallback(
    (id: string) => {
      commit(itemsRef.current.filter((x) => x.id !== id));
    },
    [commit]
  );

  const replaceAllItems = useCallback(
    (next: ContentItem[]) => {
      commit(next);
    },
    [commit]
  );

  return { items, addItem, updateItem, removeItem, replaceAllItems };
}
