#!/usr/bin/env node
/**
 * AI RAMU — Bolo Ramu, Kaam Shuru.
 * India's Personal AI Worker & Automation Platform
 */

if (process.argv.length <= 2) {
  // If invoked with no arguments, run the master all-in-one launcher
  await import("./run.mjs");
} else {
  await import("./openclaw.mjs");
}
