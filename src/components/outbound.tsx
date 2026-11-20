"use client";

import { allowFeedUrl } from "@/lib/safe-url";

/** A link we wrote ourselves. The referrer is not sent. */
export function OutboundLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} rel="noreferrer">
      {children}
    </a>
  );
}

/** A link that arrived in council data. Drop it unless the host is allowlisted. */
export function FeedLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const safe = allowFeedUrl(href);
  if (!safe) return null;
  return (
    <a href={safe} rel="noreferrer">
      {children}
    </a>
  );
}
