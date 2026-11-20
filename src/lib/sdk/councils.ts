import { notFound } from "@/lib/api/respond";
import { wellingtonAdapter, wellingtonManifest } from "@/lib/sdk/wcc";

/**
 * v1 serves one statutory adapter, resolved from the plug-in register.
 * A request may name it with ?council=. Any other id is not found.
 * Adding a council means registering another adapter here, not editing each route.
 */
export const statutoryAdapter = wellingtonAdapter;

export function assertStatutoryCouncil(url: URL) {
  const requested = url.searchParams.get("council");
  if (requested && requested !== wellingtonManifest.id) return notFound("council", requested);
  return null;
}
