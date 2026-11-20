import { json, notFound, options } from "@/lib/api/respond";
import { getMeeting } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const meeting = getMeeting(decodeURIComponent(id));
  if (!meeting) return notFound("meeting", id);
  return json({ data: meeting });
}
