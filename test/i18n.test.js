import test from "node:test";
import assert from "node:assert/strict";
import { detectLanguage, getTranslation } from "../dist/core/i18n.js";

test("detectLanguage correctly classifies English, Hindi, and Bengali scripts", () => {
  assert.equal(detectLanguage("Create a sales report"), "en");
  assert.equal(detectLanguage("नमस्ते रामू, आज का क्या काम है?"), "hi");
  assert.equal(detectLanguage("নমস্কার রামু, আজকের কাজের তালিকা দাও"), "bn");
});

test("Translation dictionaries contain all required UI keys across languages", () => {
  const en = getTranslation("en");
  const hi = getTranslation("hi");
  const bn = getTranslation("bn");

  const requiredKeys = [
    "appName",
    "tagline",
    "supportingMessage",
    "welcomeHeading",
    "btnSend",
    "tabChat",
    "tabTasks",
    "tabAutomations",
    "systemPromptGreeting",
  ];

  for (const key of requiredKeys) {
    assert.ok(en[key], `Missing English translation for ${key}`);
    assert.ok(hi[key], `Missing Hindi translation for ${key}`);
    assert.ok(bn[key], `Missing Bengali translation for ${key}`);
  }
});
