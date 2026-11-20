import { badRequest, json, notFound, options, readResourceId } from "@/lib/api/respond";
import { MINUTES_VOTE_NOTE } from "@/lib/sdk/wcc-catalog";
import { assertStatutoryCouncil } from "@/lib/sdk/councils";
import { getMember } from "@/lib/sdk/wcc-catalog";
import { memberMinutes, minutesSyncedAt } from "@/lib/minutes/load";

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
  const member = getMember(parsed.id);
  if (!member) return notFound("member", id);
  return json({
    data: {
      memberId: member.id,
      source: "official-minutes",
      syncedAt: minutesSyncedAt,
      note: MINUTES_VOTE_NOTE,
      meetings: memberMinutes(member.id),
    },
  });
}
