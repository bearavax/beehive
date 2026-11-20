import { badRequest, json, options, readPage, slicePage } from "@/lib/api/respond";
import { assertStatutoryCouncil, statutoryAdapter } from "@/lib/sdk/councils";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const denied = assertStatutoryCouncil(url);
  if (denied) return denied;
  const page = readPage(url);
  if ("error" in page) return badRequest(page.error);
  const rows = await statutoryAdapter.fetchMeetings(page);
  return json(slicePage(rows, page.limit, page.offset));
}
