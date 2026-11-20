import { json, notFound, options } from "@/lib/api/respond";
import { assertStatutoryCouncil, statutoryAdapter } from "@/lib/sdk/councils";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: Request, context: Context) {
  const denied = assertStatutoryCouncil(new URL(request.url));
  if (denied) return denied;
  const { id } = await context.params;
  const votes = await statutoryAdapter.fetchVotes(decodeURIComponent(id));
  if (!votes) return notFound("decision", id);
  return json({ data: votes });
}
