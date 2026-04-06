import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-app-grid flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-2xl font-bold text-zinc-100">
        Page not found
      </p>
      <p className="max-w-sm text-sm text-zinc-400">
        That route does not exist. Head back to the pipeline.
      </p>
      <Link
        href="/"
        className="hwn-btn-primary rounded-full px-6 py-2.5 text-sm font-semibold"
      >
        Go home
      </Link>
    </div>
  );
}
