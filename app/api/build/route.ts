import { NextResponse } from "next/server";

/** Confirms which revision Vercel built (set automatically on Vercel). */
export function GET() {
  return NextResponse.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  });
}
