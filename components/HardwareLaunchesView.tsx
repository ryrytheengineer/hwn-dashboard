"use client";

import { useMemo, useState } from "react";
import type { HardwareLaunchRow } from "@/lib/hardware-launches";
import { launchCoverageSearchUrl } from "@/lib/launch-coverage-link";

type Props = {
  launches: HardwareLaunchRow[];
  /** Tab order from the workbook (only tabs that had data). */
  sheetNames: string[];
};

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  Launched: {
    label: "Launched",
    className: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90",
  },
  Shipping: {
    label: "Shipping",
    className: "border border-sky-500/25 bg-sky-500/10 text-sky-100/90",
  },
  Announced: {
    label: "Announced",
    className: "border border-amber-500/25 bg-amber-500/10 text-amber-100/90",
  },
  Expected: {
    label: "Expected",
    className: "border border-violet-500/25 bg-violet-500/10 text-violet-100/90",
  },
  Rumored: {
    label: "Rumored",
    className: "border border-white/10 bg-white/[0.05] text-zinc-400",
  },
};

function statusStyle(status: string) {
  return (
    STATUS_STYLES[status] ?? {
      label: status,
      className: "border border-white/10 bg-white/[0.05] text-zinc-400",
    }
  );
}

const selectClass =
  "mt-1.5 w-full min-w-0 rounded-lg border border-white/12 bg-[var(--background)] px-3 py-2 text-[13px] text-zinc-200 focus:border-white/20 focus:outline-none";

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

function segmentFor(launch: HardwareLaunchRow): "consumer" | "enterprise" {
  const p = launch.estimatedPrice.toLowerCase();
  const c = launch.category.toLowerCase();
  if (p.includes("enterprise")) return "enterprise";
  if (
    c.includes("data center") ||
    c.includes("server") ||
    c.includes("storage controller") ||
    (c.includes("storage") && p.includes("enterprise"))
  )
    return "enterprise";
  if (c.includes("memory") && p.includes("enterprise")) return "enterprise";
  return "consumer";
}

export function HardwareLaunchesView({ launches, sheetNames }: Props) {
  const [segment, setSegment] = useState<"all" | "consumer" | "enterprise">(
    "all"
  );
  const [category, setCategory] = useState<string>("all");
  const [sheet, setSheet] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set(launches.map((l) => l.category));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [launches]);

  const filtered = useMemo(() => {
    return launches.filter((l) => {
      if (segment !== "all" && segmentFor(l) !== segment) return false;
      if (category !== "all" && l.category !== category) return false;
      if (sheet !== "all" && l.sheet !== sheet) return false;
      return true;
    });
  }, [launches, segment, category, sheet]);

  return (
    <>
      <div className="mb-8 rounded-lg border border-white/10 bg-[var(--background)] p-4 sm:p-5">
        <div className="mt-0 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="launch-filter-segment"
              className="text-xs text-zinc-500"
            >
              Segment
            </label>
            <select
              id="launch-filter-segment"
              className={selectClass}
              value={segment}
              onChange={(e) =>
                setSegment(e.target.value as "all" | "consumer" | "enterprise")
              }
            >
              <option value="all">All</option>
              <option value="consumer">Consumer</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="launch-filter-sheet"
              className="text-xs text-zinc-500"
            >
              Sheet
            </label>
            <select
              id="launch-filter-sheet"
              className={selectClass}
              value={sheet}
              onChange={(e) => {
                setSheet(e.target.value);
                setCategory("all");
              }}
            >
              <option value="all">All sheets</option>
              {sheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="launch-filter-category"
              className="text-xs text-zinc-500"
            >
              Category
            </label>
            <select
              id="launch-filter-category"
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm tabular-nums text-zinc-500">
        {filtered.length} of {launches.length}
      </p>

      <ul className="flex flex-col gap-4">
        {filtered.map((launch) => {
          const st = statusStyle(launch.status);
          const seg = segmentFor(launch);
          return (
            <li
              key={`${launch.sheet}:${launch.company}:${launch.product}`}
              className="rounded-lg border border-white/10 bg-[var(--background)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold leading-snug text-zinc-100">
                    {launch.product}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    <span className="text-zinc-200">{launch.company}</span>
                    <span className="text-zinc-600"> · </span>
                    {launch.category}
                    <span className="text-zinc-600"> · </span>
                    <span className="text-zinc-500">{launch.sheet}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${st.className}`}
                  >
                    {st.label}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                      seg === "consumer"
                        ? "border-white/10 bg-white/[0.04] text-zinc-400"
                        : "border-white/10 bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {seg === "consumer" ? "Consumer" : "Enterprise"}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 px-3 py-2.5">
                  <dt className="text-xs text-zinc-500">Window</dt>
                  <dd className="mt-0.5 text-sm text-zinc-200">
                    {launch.launchDate}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 px-3 py-2.5">
                  <dt className="text-xs text-zinc-500">Price</dt>
                  <dd className="mt-0.5 text-sm text-zinc-200">
                    {launch.estimatedPrice}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs text-zinc-500">References</p>
                <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4">
                  {launch.sourceUrl && isHttpUrl(launch.sourceUrl) ? (
                    <a
                      href={launch.sourceUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-zinc-300 hover:text-zinc-100"
                    >
                      Primary link
                    </a>
                  ) : null}
                  <a
                    href={launchCoverageSearchUrl(
                      launch.company,
                      launch.product
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[13px] ${
                      launch.sourceUrl && isHttpUrl(launch.sourceUrl)
                        ? "text-zinc-500 hover:text-zinc-300"
                        : "text-zinc-300 hover:text-zinc-100"
                    }`}
                  >
                    Web search
                  </a>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs text-zinc-500">Summary</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {launch.keyFeatures}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500">
          No results for this filter.
        </p>
      ) : null}
    </>
  );
}
