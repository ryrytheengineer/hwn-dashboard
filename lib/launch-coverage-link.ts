/**
 * Client-safe: web search URL when the spreadsheet has no curated source link.
 */
export function launchCoverageSearchUrl(company: string, product: string): string {
  const q = `${company} ${product} hardware launch announcement`.replace(
    /\s+/g,
    " "
  );
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
