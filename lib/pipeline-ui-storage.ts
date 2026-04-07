const SEARCH_KEY = "hwn-pipeline-search-v1";
const COMPACT_KEY = "hwn-pipeline-compact-v1";

export function readPipelineSearch(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(SEARCH_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writePipelineSearch(value: string): void {
  try {
    localStorage.setItem(SEARCH_KEY, value);
  } catch {
    /* */
  }
}

export function readPipelineCompact(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COMPACT_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePipelineCompact(compact: boolean): void {
  try {
    localStorage.setItem(COMPACT_KEY, compact ? "1" : "0");
  } catch {
    /* */
  }
}
