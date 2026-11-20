import { json, notFound, options } from "@/lib/api/respond";
import { getMember } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const member = getMember(decodeURIComponent(id));
  if (!member) return notFound("member", id);
  return json({ data: member });
}
