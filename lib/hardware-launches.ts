import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

export type HardwareLaunchRow = {
  product: string;
  company: string;
  category: string;
  launchDate: string;
  status: string;
  keyFeatures: string;
  estimatedPrice: string;
  /** Announcement, article, or leak URL (from spreadsheet). */
  sourceUrl: string;
  /** Excel worksheet tab this row came from (e.g. Wearables, Blue Chip). */
  sheet: string;
};

const REQUIRED_HEADERS = [
  "Product",
  "Company",
  "Category",
  "Launch Date",
  "Status",
  "Key Features",
  "Estimated Price",
] as const;

/** First matching column wins. */
const LINK_HEADER_ALIASES = [
  "Link",
  "Announcement URL",
  "Source URL",
  "Source",
  "URL",
] as const;

function normalizeCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) {
    return Number.isInteger(v) ? String(v) : String(v);
  }
  return String(v).trim();
}

function buildColumnMap(headerRow: string[]): Map<string, number> | null {
  const map = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    const key = cell.trim();
    if (key) map.set(key, i);
  });
  for (const h of REQUIRED_HEADERS) {
    if (!map.has(h)) return null;
  }
  return map;
}

function cellAt(row: string[], col: Map<string, number>, header: string): string {
  const i = col.get(header);
  if (i === undefined) return "";
  return (row[i] ?? "").trim();
}

function resolveSourceUrl(row: string[], col: Map<string, number>): string {
  for (const alias of LINK_HEADER_ALIASES) {
    if (!col.has(alias)) continue;
    const raw = cellAt(row, col, alias);
    if (!raw) continue;
    return normalizeSourceUrl(raw);
  }
  return "";
}

function normalizeSourceUrl(s: string): string {
  const t = s.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  return t;
}

function parseDataRow(
  cells: string[],
  col: Map<string, number>,
  sheet: string
): HardwareLaunchRow | null {
  const product = cellAt(cells, col, "Product");
  const company = cellAt(cells, col, "Company");
  if (!product && !cells.some((c) => c.trim())) return null;
  if (!product) return null;

  return {
    product,
    company,
    category: cellAt(cells, col, "Category"),
    launchDate: cellAt(cells, col, "Launch Date"),
    status: cellAt(cells, col, "Status"),
    keyFeatures: cellAt(cells, col, "Key Features"),
    estimatedPrice: cellAt(cells, col, "Estimated Price"),
    sourceUrl: resolveSourceUrl(cells, col),
    sheet,
  };
}

/** Rough sort key for timeline display (higher = later in year). */
export function launchTimelineSortKey(launchDate: string): number {
  const s = launchDate.trim().toLowerCase();
  const yMatch = /20\d{2}/.exec(s);
  const year = yMatch ? Number(yMatch[0]) : 2026;
  let frac = 0.5;
  if (/\bjanuary\b/i.test(s)) frac = 0.04;
  else if (/\bfebruary\b/i.test(s)) frac = 0.12;
  else if (/\bmarch\b/i.test(s)) frac = 0.2;
  else if (/\bapril\b/i.test(s)) frac = 0.28;
  else if (/\bmay\b/i.test(s)) frac = 0.36;
  else if (/\bjune\b/i.test(s)) frac = 0.44;
  else if (/\bjuly\b/i.test(s)) frac = 0.52;
  else if (/\baugust\b/i.test(s)) frac = 0.6;
  else if (/\bseptember\b/i.test(s)) frac = 0.68;
  else if (/\boctober\b/i.test(s)) frac = 0.76;
  else if (/\bnovember\b/i.test(s)) frac = 0.84;
  else if (/\bdecember\b/i.test(s)) frac = 0.92;
  else if (/\bq1\b/i.test(s)) frac = 0.2;
  else if (/\bq2\b/i.test(s)) frac = 0.45;
  else if (/\bq3\b/i.test(s)) frac = 0.7;
  else if (/\bq4\b/i.test(s)) frac = 0.95;
  else if (/\bh1\b/i.test(s)) frac = 0.35;
  else if (/\bh2\b/i.test(s)) frac = 0.78;
  else if (/\bmid\b/i.test(s)) frac = 0.55;
  else if (/^20\d{2}$/.test(s.trim())) frac = 0.5;
  return year + frac;
}

export type HardwareLaunchesPayload = {
  launches: HardwareLaunchRow[];
  /** Worksheet tab order as in the workbook (tabs that contributed rows). */
  sheetNames: string[];
};

/**
 * Loads `data/2026-hardware-launches.xlsx`, merges every tab that uses the
 * standard column header row, and sorts by launch window.
 *
 * Optional column (any one of): Link, Announcement URL, Source URL, Source, URL
 */
export function loadHardwareLaunchesFromWorkbook(): HardwareLaunchesPayload {
  const file = path.join(process.cwd(), "data", "2026-hardware-launches.xlsx");
  const buf = fs.readFileSync(file);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: false });

  const launches: HardwareLaunchRow[] = [];
  const usedSheets: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawRows = XLSX.utils.sheet_to_json<(unknown | undefined)[]>(ws, {
      header: 1,
      defval: "",
    });

    const rows: string[][] = rawRows.map((r) =>
      Array.isArray(r) ? r.map(normalizeCell) : []
    );

    if (rows.length < 2) continue;
    const header = rows[0]!.map((c) => c.trim());
    const colMap = buildColumnMap(header);
    if (!colMap) continue;

    let any = false;
    for (let i = 1; i < rows.length; i++) {
      const parsed = parseDataRow(rows[i]!, colMap, sheetName);
      if (parsed) {
        launches.push(parsed);
        any = true;
      }
    }
    if (any) usedSheets.push(sheetName);
  }

  const sorted = [...launches].sort(
    (a, b) =>
      launchTimelineSortKey(a.launchDate) - launchTimelineSortKey(b.launchDate)
  );

  return { launches: sorted, sheetNames: usedSheets };
}
