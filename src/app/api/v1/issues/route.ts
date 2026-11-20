import { json, options } from "@/lib/api/respond";
import { listIssues } from "@/lib/sdk/wcc-catalog";

export function OPTIONS() {
  return options();
}

export function GET() {
  return json({ data: listIssues() });
}
