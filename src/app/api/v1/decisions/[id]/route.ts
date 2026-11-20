import { json, notFound, options } from "@/lib/api/respond";
import { getDecision } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const decision = getDecision(decodeURIComponent(id));
  if (!decision) return notFound("decision", id);
  return json({ data: decision });
}
