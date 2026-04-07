const KEY = "hwn-launches-filters-v1";

export type LaunchesFilterState = {
  segment: "all" | "consumer" | "enterprise";
  category: string;
  sheet: string;
};

function isSegment(x: unknown): x is LaunchesFilterState["segment"] {
  return x === "all" || x === "consumer" || x === "enterprise";
}

export function readLaunchesFilters(): LaunchesFilterState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!isSegment(o.segment)) return null;
    if (typeof o.category !== "string") return null;
    if (typeof o.sheet !== "string") return null;
    return { segment: o.segment, category: o.category, sheet: o.sheet };
  } catch {
    return null;
  }
}

export function writeLaunchesFilters(s: LaunchesFilterState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* */
  }
}
