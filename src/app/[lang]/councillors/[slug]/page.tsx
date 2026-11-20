import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Profile } from "@/components/directory";
import { memberBySlug } from "@/data/members";
import { memberMinutes } from "@/lib/minutes/load";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = memberBySlug(slug);
  if (!member) return { title: "Member" };
  return { title: member.name, description: `${member.wardEn}. ${member.mandateEn}` };
}

export default async function MemberPage({ params }: Props) {
  const { slug } = await params;
  const member = memberBySlug(slug);
  if (!member) notFound();
  return <Profile member={member} meetings={memberMinutes(member.slug)} />;
}
