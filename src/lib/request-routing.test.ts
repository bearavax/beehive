import assert from "node:assert/strict";
import test from "node:test";
import { isApiPath, isInvalidLocale, planLanguage, preferredLang } from "./request-routing";

test("api paths are only the /api segment", () => {
  assert.equal(isApiPath("/api"), true);
  assert.equal(isApiPath("/api/v1"), true);
  assert.equal(isApiPath("/api/v1/decisions"), true);
  assert.equal(isApiPath("/appetite"), false);
  assert.equal(isApiPath("/apples"), false);
  assert.equal(isApiPath("/en"), false);
});

test("preferred language is the cookie, then mi, then bilingual", () => {
  assert.equal(preferredLang("en", "mi"), "en");
  assert.equal(preferredLang(undefined, "mi-NZ,en;q=0.8"), "mi");
  assert.equal(preferredLang(undefined, "mi;q=0.9,en;q=0.8"), "mi");
  assert.equal(preferredLang(undefined, "en-NZ,mi;q=0.9"), "bi");
  assert.equal(preferredLang(undefined, "mine"), "bi");
  assert.equal(preferredLang("nope", null), "bi");
});

test("an old reo query redirects onto the language path without a trailing slash", () => {
  assert.deepEqual(planLanguage("/en", "mi", "bi"), { action: "redirect", pathname: "/mi", lang: "mi" });
  assert.deepEqual(planLanguage("/en/decisions/a.b", "mi", "bi"), {
    action: "redirect",
    pathname: "/mi/decisions/a.b",
    lang: "mi",
  });
  assert.deepEqual(planLanguage("/about", "en", "bi"), { action: "redirect", pathname: "/en/about", lang: "en" });
  assert.deepEqual(planLanguage("/", "mi", "bi"), { action: "redirect", pathname: "/mi", lang: "mi" });
});

test("an unknown locale is a direct 404 and a real page still redirects", () => {
  assert.equal(isInvalidLocale("fr"), true);
  assert.equal(isInvalidLocale("en-us"), true);
  assert.equal(isInvalidLocale("en"), false);
  assert.equal(isInvalidLocale("about"), false);
  assert.deepEqual(planLanguage("/fr", null, "bi"), { action: "not-found" });
  assert.deepEqual(planLanguage("/fr/decisions", "mi", "bi"), { action: "not-found" });
  assert.deepEqual(planLanguage("/about", null, "bi"), { action: "redirect", pathname: "/bi/about", lang: "bi" });
});

test("a bare path uses the preferred language and a prefixed path renders", () => {
  assert.deepEqual(planLanguage("/", null, "mi"), { action: "redirect", pathname: "/mi", lang: "mi" });
  assert.deepEqual(planLanguage("/decisions", null, "bi"), { action: "redirect", pathname: "/bi/decisions", lang: "bi" });
  assert.deepEqual(planLanguage("/mi/about", null, "en"), { action: "render", lang: "mi" });
  assert.deepEqual(planLanguage("/en", "en", "bi"), { action: "render", lang: "en" });
});
