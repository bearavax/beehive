import type { Metadata } from "next";
import { AboutView } from "@/components/about-view";
import { syncedAt } from "@/lib/data";

export const metadata: Metadata = {
  title: "Te tikanga me Te Tiriti",
  description: "How Beehive reads Mātai Manapori, and its commitment to Te Tiriti o Waitangi.",
};

export default function AboutPage() {
  return <AboutView syncedAt={syncedAt} />;
}
