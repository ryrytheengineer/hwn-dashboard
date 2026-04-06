import type { Metadata } from "next";
import { HardwareNewsAgent } from "@/components/HardwareNewsAgent";
import { getHardwareNews } from "@/lib/fetch-hardware-news";

export const metadata: Metadata = {
  title: "Hardware news agent | Hardware Nation",
  description:
    "Aggregated hardware and tech headlines from trusted RSS sources.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await getHardwareNews();
  return <HardwareNewsAgent initialItems={items} />;
}
