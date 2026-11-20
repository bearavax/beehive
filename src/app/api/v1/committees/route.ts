import { json, options } from "@/lib/api/respond";
import { listCommittees } from "@/lib/sdk/wcc-catalog";

export function OPTIONS() {
  return options();
}

export function GET() {
  return json({ data: listCommittees() });
}
