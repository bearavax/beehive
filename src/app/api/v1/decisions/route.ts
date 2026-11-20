import { badRequest, json, options, readPage, slicePage } from "@/lib/api/respond";
import { wellingtonAdapter } from "@/lib/sdk/wcc";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  const page = readPage(new URL(request.url));
  if ("error" in page) return badRequest(page.error);
  const rows = await wellingtonAdapter.fetchDecisions(page);
  return json(slicePage(rows, page.limit, page.offset));
}
