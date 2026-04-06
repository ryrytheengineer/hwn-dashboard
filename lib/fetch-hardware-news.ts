import { unstable_cache } from "next/cache";
import Parser from "rss-parser";
import { HARDWARE_NEWS_INTERVAL_SECONDS } from "@/lib/hardware-news-config";
import { shouldIncludeHardwareNewsItem } from "@/lib/hardware-news-filter";
import { HARDWARE_NEWS_FEEDS } from "@/lib/hardware-news-sources";

export type HardwareNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
};

const parser = new Parser({
  timeout: 14000,
  headers: {
    "User-Agent":
      "HardwareNationNewsAgent/1.0 (RSS reader; contact: editorial)",
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
});

function trimSummary(text: string | undefined | null): string | null {
  if (!text?.trim()) return null;
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > 320 ? `${one.slice(0, 317)}…` : one;
}

async function fetchOneFeed(
  url: string,
  sourceLabel: string
): Promise<HardwareNewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const out: HardwareNewsItem[] = [];
    for (const item of feed.items ?? []) {
      const link = item.link?.trim();
      const title = item.title?.trim();
      if (!link || !title) continue;
      let publishedAt: string | null = null;
      const raw = item.isoDate ?? item.pubDate;
      if (raw) {
        const d = new Date(raw);
        publishedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
      }
      const summary =
        trimSummary(item.contentSnippet) ??
        trimSummary(
          typeof item.summary === "string" ? item.summary : undefined
        );
      out.push({
        id: `${sourceLabel}:${link}`,
        title,
        link,
        source: sourceLabel,
        publishedAt,
        summary,
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function aggregateFeeds(): Promise<HardwareNewsItem[]> {
  const batches = await Promise.all(
    HARDWARE_NEWS_FEEDS.map((f) => fetchOneFeed(f.url, f.shortName))
  );
  const flat = batches
    .flat()
    .filter((item) =>
      shouldIncludeHardwareNewsItem(item.title, item.summary)
    );
  const seen = new Set<string>();
  const unique: HardwareNewsItem[] = [];
  for (const item of flat) {
    const key = item.link.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  unique.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
  return unique.slice(0, 60);
}

/** Same aggregation as the cache, without reading the cache. */
export function fetchHardwareNewsUncached(): Promise<HardwareNewsItem[]> {
  return aggregateFeeds();
}

export const getHardwareNews = unstable_cache(aggregateFeeds, ["hardware-news-v3"], {
  revalidate: HARDWARE_NEWS_INTERVAL_SECONDS,
  tags: ["hardware-news"],
});
