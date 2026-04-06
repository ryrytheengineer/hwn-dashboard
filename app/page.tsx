import { ContentTrackerLoader } from "@/components/ContentTrackerLoader";

export default function Home() {
  return (
    <div className="bg-app-grid flex h-dvh min-h-0 flex-col overflow-hidden">
      <ContentTrackerLoader />
    </div>
  );
}
