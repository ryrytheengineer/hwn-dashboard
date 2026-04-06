import type { ContentItem } from "@/lib/content-types";
import { isScheduledStage } from "@/lib/content-types";

/** Parse YYYY-MM-DD + optional HH:mm to epoch ms in local time. */
export function filmDateTimeMs(item: ContentItem): number | null {
  if (!isScheduledStage(item.stageId) || !item.date?.trim()) return null;
  const time = item.filmTime?.trim();
  const iso = time && /^\d{1,2}:\d{2}/.test(time)
    ? `${item.date}T${time.length === 5 ? time : time.slice(0, 5)}:00`
    : `${item.date}T12:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export type FilmSoonKind = "soon" | "past";

/** Within next 7 days (and not past) → soon; already passed → past. */
export function filmSoonKind(item: ContentItem): FilmSoonKind | null {
  if (!isScheduledStage(item.stageId)) return null;
  const t = filmDateTimeMs(item);
  if (t == null) return null;
  const now = Date.now();
  const days = (t - now) / (86_400_000);
  if (days < 0) return "past";
  if (days <= 7) return "soon";
  return null;
}

export function compareFilmOrder(a: ContentItem, b: ContentItem): number {
  const ta = filmDateTimeMs(a);
  const tb = filmDateTimeMs(b);
  if (ta == null && tb == null) return 0;
  if (ta == null) return 1;
  if (tb == null) return -1;
  return ta - tb;
}

export function upcomingFilms(
  items: ContentItem[],
  limit: number
): ContentItem[] {
  const films = items.filter((i) => isScheduledStage(i.stageId));
  const withMs = films
    .map((i) => ({ item: i, ms: filmDateTimeMs(i) }))
    .filter((x): x is { item: ContentItem; ms: number } => x.ms != null)
    .sort((a, b) => a.ms - b.ms);
  const now = Date.now();
  const future = withMs.filter((x) => x.ms >= now);
  return future.slice(0, limit).map((x) => x.item);
}

export function filterItemsBySearch(
  items: ContentItem[],
  query: string
): ContentItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((i) => {
    const hay = [
      i.founderName,
      i.jobTitle,
      i.notes,
      ...i.checklist.map((c) => c.text),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
