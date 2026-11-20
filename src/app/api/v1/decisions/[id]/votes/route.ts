import { json, notFound, options } from "@/lib/api/respond";
import { wellingtonAdapter } from "@/lib/sdk/wcc";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const votes = await wellingtonAdapter.fetchVotes(decodeURIComponent(id));
  if (!votes) return notFound("decision", id);
  return json({ data: votes });
}
