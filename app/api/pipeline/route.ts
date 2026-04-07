import { NextResponse } from "next/server";
import { parsePipelineImportJson } from "@/lib/content-normalize";
import { readSharedPipeline, writeSharedPipeline } from "@/lib/shared-pipeline-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await readSharedPipeline();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Could not load shared pipeline.", items: [] },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const next = parsePipelineImportJson(body);
    if (!next) {
      return NextResponse.json(
        { error: "Invalid pipeline payload." },
        { status: 400 }
      );
    }
    await writeSharedPipeline(next);
    return NextResponse.json({ ok: true, count: next.length });
  } catch {
    return NextResponse.json(
      { error: "Could not save shared pipeline." },
      { status: 502 }
    );
  }
}

