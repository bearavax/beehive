import { json, options } from "@/lib/api/respond";
import { assertStatutoryCouncil } from "@/lib/sdk/councils";
import { listCommittees } from "@/lib/sdk/wcc-catalog";

export function OPTIONS() {
  return options();
}

export function GET(request: Request) {
  const denied = assertStatutoryCouncil(new URL(request.url));
  if (denied) return denied;
  return json({ data: listCommittees() });
}
