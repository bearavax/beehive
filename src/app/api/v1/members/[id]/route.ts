import { json, notFound, options } from "@/lib/api/respond";
import { assertStatutoryCouncil } from "@/lib/sdk/councils";
import { getMember } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: Request, context: Context) {
  const denied = assertStatutoryCouncil(new URL(request.url));
  if (denied) return denied;
  const { id } = await context.params;
  const member = getMember(decodeURIComponent(id));
  if (!member) return notFound("member", id);
  return json({ data: member });
}
