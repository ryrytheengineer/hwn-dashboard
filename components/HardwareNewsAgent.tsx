"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HardwareNewsItem } from "@/lib/fetch-hardware-news";
import { HARDWARE_NEWS_POLL_MS } from "@/lib/hardware-news-config";

type Props = {
  initialItems: HardwareNewsItem[];
};

function formatNewsDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HardwareNewsAgent({ initialItems }: Props) {
  const [items, setItems] = useState<HardwareNewsItem[]>(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const sourceCount = useMemo(() => new Set(items.map((i) => i.source)).size, [items]);

  const runAgent = useCallback(async (refresh: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const q = refresh ? "?refresh=1" : "";
      const res = await fetch(`/api/hardware-news${q}`, { cache: "no-store" });
      const data = (await res.json()) as {
        items?: HardwareNewsItem[];
        fetchedAt?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      if (Array.isArray(data.items)) setItems(data.items);
      if (data.fetchedAt) setFetchedAt(data.fetchedAt);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const pollLatestQuiet = useCallback(async () => {
    try {
      const res = await fetch("/api/hardware-news", { cache: "no-store" });
      const data = (await res.json()) as {
        items?: HardwareNewsItem[];
        fetchedAt?: string;
      };
      if (!res.ok) return;
      if (Array.isArray(data.items)) setItems(data.items);
      if (data.fetchedAt) setFetchedAt(data.fetchedAt);
    } catch {
      /* keep existing list on background failure */
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void pollLatestQuiet();
    };
    const id = window.setInterval(tick, HARDWARE_NEWS_POLL_MS);
    return () => window.clearInterval(id);
  }, [pollLatestQuiet]);

  return (
    <div className="bg-app-grid flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 shrink-0 border-b border-white/10 bg-[var(--background)]/92 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
            <Link
              href="/"
              className="flex h-9 shrink-0 items-center"
              aria-label="Hardware Nation home"
            >
              <Image
                src="/hwn-logo.png"
                alt=""
                width={28}
                height={36}
                className="h-9 w-auto max-w-[34px] object-contain object-left"
              />
            </Link>
            <Link
              href="/"
              className="mt-0.5 rounded-lg border border-white/12 bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/18 hover:text-zinc-200"
            >
              Pipeline
            </Link>
            <Link
              href="/launches"
              className="mt-0.5 rounded-lg border border-white/12 bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/18 hover:text-zinc-200"
            >
              Launches
            </Link>
            <div>
              <p className="text-xl font-semibold tracking-tight text-zinc-100">
                News
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Consumer hardware RSS. Refreshes about hourly while this tab is
                open.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => runAgent(false)}
              className="rounded-lg border border-white/12 bg-[var(--background)] px-3 py-2 text-[13px] font-medium text-zinc-300 transition hover:border-white/18 hover:text-zinc-100 disabled:opacity-50"
            >
              {busy ? "Updating…" : "Refresh"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAgent(true)}
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[13px] font-medium text-zinc-300 transition hover:border-white/18 hover:text-zinc-100 disabled:opacity-50"
              title="Bypass cache and pull all feeds again"
            >
              Hard refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm tabular-nums text-zinc-500">
            {items.length} items · {sourceCount} feeds
          </p>
          {fetchedAt ? (
            <p className="text-xs text-zinc-500">
              Updated{" "}
              <time dateTime={fetchedAt} className="tabular-nums text-zinc-400">
                {new Date(fetchedAt).toLocaleString()}
              </time>
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-500/25 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
            {error}
          </div>
        ) : null}

        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg border border-white/10 bg-[var(--background)] p-4 transition hover:border-white/16"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-zinc-100 group-hover:text-zinc-50">
                    {item.title}
                  </h2>
                  <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-zinc-500">
                    {item.source}
                  </span>
                </div>
                <p className="mt-2 text-xs tabular-nums text-zinc-500">
                  {formatNewsDate(item.publishedAt)}
                </p>
                {item.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                    {item.summary}
                  </p>
                ) : null}
              </a>
            </li>
          ))}
        </ul>

        {items.length === 0 && !busy ? (
          <p className="mt-12 text-center text-sm text-zinc-500">
            Nothing loaded. Use Refresh.
          </p>
        ) : null}
      </main>
    </div>
  );
}
