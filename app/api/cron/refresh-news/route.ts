import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { fetchHardwareNewsUncached } from "@/lib/fetch-hardware-news";

/**
 * Vercel Cron (see vercel.json). Secured via CRON_SECRET or x-vercel-cron.
 */
function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    return request.headers.get("authorization") === `Bearer ${secret}`;
  }
  return request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    revalidateTag("hardware-news", "default");
    const items = await fetchHardwareNewsUncached();
    return NextResponse.json({
      ok: true,
      count: items.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
