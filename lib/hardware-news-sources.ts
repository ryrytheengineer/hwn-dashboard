/** Public RSS endpoints — structured for aggregation (no HTML scraping). */
export const HARDWARE_NEWS_FEEDS = [
  {
    shortName: "Tom's Hardware",
    url: "https://www.tomshardware.com/feeds/all",
  },
  {
    shortName: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
  },
  {
    shortName: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
  },
  {
    shortName: "Engadget",
    url: "https://www.engadget.com/rss.xml",
  },
  {
    shortName: "TechCrunch",
    url: "https://techcrunch.com/feed/",
  },
] as const;
