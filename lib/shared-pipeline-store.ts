import { parsePipelineImportJson } from "@/lib/content-normalize";
import type { ContentItem } from "@/lib/content-types";

/**
 * Public shared JSON endpoint used as the multi-user pipeline source of truth.
 * Override with PIPELINE_STORE_URL in Vercel env if you rotate/migrate later.
 */
const DEFAULT_PIPELINE_STORE_URL =
  "https://jsonblob.com/api/jsonBlob/019d68b7-7cde-7102-903a-f620d70df69d";

function pipelineStoreUrl(): string {
  return process.env.PIPELINE_STORE_URL ?? DEFAULT_PIPELINE_STORE_URL;
}

export async function readSharedPipeline(): Promise<ContentItem[]> {
  const res = await fetch(pipelineStoreUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Shared store read failed (${res.status})`);
  const raw = (await res.json()) as unknown;
  return parsePipelineImportJson(raw) ?? [];
}

export async function writeSharedPipeline(items: ContentItem[]): Promise<void> {
  const res = await fetch(pipelineStoreUrl(), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(items),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shared store write failed (${res.status})`);
}

