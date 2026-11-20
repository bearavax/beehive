import assert from "node:assert/strict";
import test from "node:test";
import { htmlLang } from "./lang";

test("the document language is Māori only on the Māori path", () => {
  assert.equal(htmlLang("mi"), "mi");
  assert.equal(htmlLang("en"), "en");
  assert.equal(htmlLang("bi"), "en");
  assert.equal(htmlLang(null), "en");
});
