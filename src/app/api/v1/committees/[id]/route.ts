import { json, notFound, options } from "@/lib/api/respond";
import { getCommittee } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const committee = getCommittee(decodeURIComponent(id));
  if (!committee) return notFound("committee", id);
  return json({ data: committee });
}
