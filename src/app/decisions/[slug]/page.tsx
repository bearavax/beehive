import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DecisionView } from "@/components/decision-view";
import { decisionBySlug, decisions, withPlain } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return decisions.map((decision) => ({ slug: decision.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decision = decisionBySlug(slug);
  if (!decision) return { title: "Decision" };
  return {
    title: decision.title,
    description: decision.summary || `${decision.committeeMi} | ${decision.committeeEn}`,
  };
}

export default async function DecisionPage({ params }: Props) {
  const { slug } = await params;
  const decision = decisionBySlug(slug);
  if (!decision) notFound();
  const view = withPlain(decision);
  return <DecisionView decision={view.decision} plain={view.plain} tally={view.tally} />;
}
