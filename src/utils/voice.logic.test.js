import { test } from "node:test";
import assert from "node:assert/strict";
import { pickMimeType, baseMime, formatDuration, secondsLeft } from "./voice.logic.js";

test("picks Opus/WebM first, then MP4 for iPhone-style recorders", () => {
  assert.equal(pickMimeType((t) => t.startsWith("audio/webm")), "audio/webm;codecs=opus");
  assert.equal(pickMimeType((t) => t === "audio/mp4"), "audio/mp4");
  assert.equal(pickMimeType(() => false), "");
  assert.equal(pickMimeType(undefined), "");
  assert.equal(pickMimeType(() => { throw new Error("x"); }), "");
});

test("base mime for uploads", () => {
  assert.equal(baseMime("audio/webm;codecs=opus"), "audio/webm");
  assert.equal(baseMime(""), "audio/webm");
  assert.equal(baseMime("audio/mp4"), "audio/mp4");
});

test("duration format and remaining time", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(84), "1:24");
  assert.equal(formatDuration(120), "2:00");
  assert.equal(formatDuration(-5), "0:00");
  assert.equal(secondsLeft(30.6), 90);
  assert.equal(secondsLeft(130), 0);
});
