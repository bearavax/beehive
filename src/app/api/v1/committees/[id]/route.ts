import { json, notFound, options } from "@/lib/api/respond";
import { assertStatutoryCouncil } from "@/lib/sdk/councils";
import { getCommittee } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: Request, context: Context) {
  const denied = assertStatutoryCouncil(new URL(request.url));
  if (denied) return denied;
  const { id } = await context.params;
  const committee = getCommittee(decodeURIComponent(id));
  if (!committee) return notFound("committee", id);
  return json({ data: committee });
}
