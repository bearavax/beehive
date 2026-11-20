import type { Metadata } from "next";
import { IssueIndex } from "@/components/issues-view";
import { issues } from "@/data/issues";
import { decisions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ngā kaupapa",
  description: "Cross-meeting threads for rates, Tiaki Wai, transport, and housing.",
};

export default function IssuesPage() {
  const counts = Object.fromEntries(
    issues.map((issue) => {
      const rows = decisions.filter((decision) => decision.issueIds.includes(issue.slug));
      return [
        issue.slug,
        {
          total: rows.length,
          inProgress: rows.filter((row) => row.implementation.status === "In progress").length,
          unrecorded: rows.filter((row) => row.implementation.status === null).length,
        },
      ];
    }),
  );
  return <IssueIndex issues={issues} counts={counts} />;
}
