import { badRequest, json, options, readPage, slicePage } from "@/lib/api/respond";
import { listMembers } from "@/lib/sdk/wcc-catalog";

export function OPTIONS() {
  return options();
}

export function GET(request: Request) {
  const page = readPage(new URL(request.url));
  if ("error" in page) return badRequest(page.error);
  return json(slicePage(listMembers(), page.limit, page.offset));
}
