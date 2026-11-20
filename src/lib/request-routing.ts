import { isLang, type Lang } from "@/lib/lang";

/** True for the public API only. `/appetite` is not an API path. */
export function isApiPath(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function preferredLang(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Lang {
  if (isLang(cookie)) return cookie;
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (first === "mi" || first.startsWith("mi-")) return "mi";
  return "bi";
}

/** A first segment that looks like a language tag and is not one we publish. */
export function isInvalidLocale(segment: string) {
  return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(segment) && !isLang(segment);
}

export function planLanguage(
  pathname: string,
  reo: string | null,
  preferred: Lang,
): { action: "redirect"; pathname: string; lang: Lang } | { action: "render"; lang: Lang } | { action: "not-found" } {
  const segment = pathname.split("/")[1] ?? "";
  if (isInvalidLocale(segment)) return { action: "not-found" };
  if (isLang(reo) && segment !== reo) {
    const rest = isLang(segment) ? pathname.slice(segment.length + 1) : pathname;
    const next = rest === "/" || rest === "" ? `/${reo}` : `/${reo}${rest.startsWith("/") ? rest : `/${rest}`}`;
    return { action: "redirect", pathname: next, lang: reo };
  }
  if (!isLang(segment)) {
    const next = pathname === "/" ? `/${preferred}` : `/${preferred}${pathname}`;
    return { action: "redirect", pathname: next, lang: preferred };
  }
  return { action: "render", lang: segment };
}
