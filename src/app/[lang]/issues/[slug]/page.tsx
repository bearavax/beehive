import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssueThread } from "@/components/issues-view";
import { issueBySlug } from "@/data/issues";
import { cards, decisionsForIssue } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = issueBySlug(slug);
  if (!issue) return { title: "Issue" };
  return { title: `${issue.mi} — ${issue.en}`, description: issue.summaryEn };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = issueBySlug(slug);
  if (!issue) notFound();
  const allowed = new Set(decisionsForIssue(slug).map((decision) => decision.slug));
  const items = cards().filter((card) => allowed.has(card.slug));
  return <IssueThread issue={issue} items={items} />;
}
