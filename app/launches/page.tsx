import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HardwareLaunchesView } from "@/components/HardwareLaunchesView";
import { loadHardwareLaunchesFromWorkbook } from "@/lib/hardware-launches";

export const metadata: Metadata = {
  title: "2026 product launches | Hardware Nation",
  description:
    "Major 2026 hardware platform launches—at a glance for teams building consumer and enterprise products.",
};

export const dynamic = "force-static";

export default function LaunchesPage() {
  const { launches, sheetNames } = loadHardwareLaunchesFromWorkbook();

  return (
    <div className="bg-app-grid flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 shrink-0 border-b border-white/10 bg-[var(--background)]/92 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
            <Link
              href="/"
              className="flex h-9 shrink-0 items-center"
              aria-label="Hardware Nation home"
            >
              <Image
                src="/hwn-logo.png"
                alt=""
                width={28}
                height={36}
                className="h-9 w-auto max-w-[34px] object-contain object-left"
              />
            </Link>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="mt-0.5 rounded-lg border border-white/12 bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/18 hover:text-zinc-200"
              >
                Pipeline
              </Link>
              <Link
                href="/news"
                className="mt-0.5 rounded-lg border border-white/12 bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/18 hover:text-zinc-200"
              >
                News
              </Link>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-zinc-100">
                Launches
              </p>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                Source:{" "}
                <code className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-zinc-400">
                  data/2026-hardware-launches.xlsx
                </code>
                . Optional{" "}
                <span className="text-zinc-400">Link</span> column for a primary
                URL; otherwise each row links to search.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <HardwareLaunchesView launches={launches} sheetNames={sheetNames} />
      </main>
    </div>
  );
}
