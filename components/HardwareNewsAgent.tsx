"use client";

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
      <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className="mt-0.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
            >
              ← Pipeline
            </Link>
            <div>
              <p className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-zinc-900">
                Hardware news agent
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Pulls the latest headlines from major tech &amp; hardware RSS
                feeds. The list auto-refreshes about every hour while this tab
                is open; use the buttons below to pull sooner.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => runAgent(false)}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {busy ? "Working…" : "Fetch latest"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAgent(true)}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              title="Bypass server cache and re-pull all feeds"
            >
              Force refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-zinc-600">
            <span className="tabular-nums font-semibold text-zinc-900">
              {items.length}
            </span>{" "}
            stories
            <span className="text-zinc-400"> · </span>
            <span className="tabular-nums">{sourceCount}</span> sources
          </p>
          {fetchedAt ? (
            <p className="text-xs text-zinc-400">
              Last run:{" "}
              <time dateTime={fetchedAt} className="tabular-nums text-zinc-500">
                {new Date(fetchedAt).toLocaleString()}
              </time>
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
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
                className="group block rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_32px_-20px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-syne)] text-base font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-zinc-700">
                    {item.title}
                  </h2>
                  <span className="shrink-0 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                    {item.source}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium tabular-nums text-zinc-400">
                  {formatNewsDate(item.publishedAt)}
                </p>
                {item.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                    {item.summary}
                  </p>
                ) : null}
                <p className="mt-3 text-xs font-semibold text-teal-700 opacity-0 transition group-hover:opacity-100">
                  Open article →
                </p>
              </a>
            </li>
          ))}
        </ul>

        {items.length === 0 && !busy ? (
          <p className="mt-12 text-center text-sm text-zinc-500">
            No stories yet. Check your connection and tap{" "}
            <span className="font-semibold text-zinc-700">Fetch latest</span>.
          </p>
        ) : null}
      </main>
    </div>
  );
}
