import { json, notFound, options } from "@/lib/api/respond";
import { getIssue } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const issue = getIssue(decodeURIComponent(id));
  if (!issue) return notFound("issue", id);
  return json({ data: issue });
}
