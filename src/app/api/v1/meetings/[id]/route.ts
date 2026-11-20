import { badRequest, json, notFound, options, readResourceId } from "@/lib/api/respond";
import { assertStatutoryCouncil } from "@/lib/sdk/councils";
import { getMeeting } from "@/lib/sdk/wcc-catalog";

type Context = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: Request, context: Context) {
  const denied = assertStatutoryCouncil(new URL(request.url));
  if (denied) return denied;
  const { id } = await context.params;
  const parsed = readResourceId(id);
  if ("error" in parsed) return badRequest("id");
  const meeting = getMeeting(parsed.id);
  if (!meeting) return notFound("meeting", id);
  return json({ data: meeting });
}
