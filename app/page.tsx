import { ContentTrackerLoader } from "@/components/ContentTrackerLoader";

export default function Home() {
  return (
    <div className="bg-app-grid flex min-h-screen flex-col">
      <ContentTrackerLoader />
    </div>
  );
}
