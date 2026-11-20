import type { Metadata } from "next";
import { HowView } from "@/components/how-view";
import { minutesSummary } from "@/lib/minutes/load";

export const metadata: Metadata = {
  title: "How this works",
  description: "How Beehive collects council minutes, what the program does, and how to report an error.",
};

export default function HowThisWorksPage() {
  const summary = minutesSummary();
  return <HowView {...summary} />;
}
