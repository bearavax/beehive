import { json, options } from "@/lib/api/respond";
import { assertStatutoryCouncil } from "@/lib/sdk/councils";
import { listIssues } from "@/lib/sdk/wcc-catalog";

export function OPTIONS() {
  return options();
}

export function GET(request: Request) {
  const denied = assertStatutoryCouncil(new URL(request.url));
  if (denied) return denied;
  return json({ data: listIssues() });
}
