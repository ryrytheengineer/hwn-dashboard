"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const ContentTracker = dynamic(
  () =>
    import("@/components/ContentTracker").then((mod) => mod.ContentTracker),
  {
    ssr: false,
    loading: () => (
      <div className="bg-app-grid flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-12 items-center">
          <Image
            src="/hwn-logo.png"
            alt=""
            width={40}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-32 animate-pulse rounded-full bg-[#dfff00]/40" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-white/12" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Loading tracker
        </p>
      </div>
    ),
  }
);

export function ContentTrackerLoader() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ContentTracker />
    </div>
  );
}
