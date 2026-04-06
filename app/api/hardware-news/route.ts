import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  fetchHardwareNewsUncached,
  getHardwareNews,
} from "@/lib/fetch-hardware-news";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    if (url.searchParams.get("refresh") === "1") {
      revalidateTag("hardware-news", "default");
      const items = await fetchHardwareNewsUncached();
      return NextResponse.json({
        items,
        fetchedAt: new Date().toISOString(),
      });
    }

    const items = await getHardwareNews();
    return NextResponse.json({
      items,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load hardware headlines right now.", items: [] },
      { status: 502 }
    );
  }
}
