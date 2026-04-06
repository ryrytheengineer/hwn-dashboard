"use client";

import dynamic from "next/dynamic";

const ContentTracker = dynamic(
  () =>
    import("@/components/ContentTracker").then((mod) => mod.ContentTracker),
  {
    ssr: false,
    loading: () => (
      <div className="bg-app-grid flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
          HN
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-32 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-zinc-100" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Loading tracker
        </p>
      </div>
    ),
  }
);

export function ContentTrackerLoader() {
  return <ContentTracker />;
}
