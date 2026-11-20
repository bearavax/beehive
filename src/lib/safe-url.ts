const COUNCIL_HOST = /(^|\.)wellington\.govt\.nz$/i;
const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** https URLs on Wellington City Council hosts, or an allowlisted video host. Anything else is dropped. */
export function allowFeedUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (COUNCIL_HOST.test(host) || VIDEO_HOSTS.has(host)) return url.toString();
  return null;
}
