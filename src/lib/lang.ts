export const langs = ["en", "mi", "bi"] as const;

export type Lang = (typeof langs)[number];

export function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "mi" || value === "bi";
}

export function withLang(lang: Lang, path: string) {
  if (path === "/" || path === "") return `/${lang}`;
  return `/${lang}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripLang(pathname: string) {
  const parts = pathname.split("/");
  if (isLang(parts[1])) parts.splice(1, 1);
  const bare = parts.join("/") || "/";
  return bare.startsWith("/") ? bare : `/${bare}`;
}
