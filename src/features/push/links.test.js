import { test } from "node:test";
import assert from "node:assert/strict";
import { safeLink } from "./links.js";

test("only in-app links are followed from a notification", () => {
  assert.equal(safeLink("/messages/pub_A__req_B__rec_C"), "/messages/pub_A__req_B__rec_C");
  assert.equal(safeLink("/field-posts/abc123"), "/field-posts/abc123");
  assert.equal(safeLink("/night-stay?tab=herds"), "/night-stay?tab=herds");
  assert.equal(safeLink("https://evil.example"), "/");
  assert.equal(safeLink("//evil.example"), "/");
  assert.equal(safeLink("javascript:alert(1)"), "/");
  assert.equal(safeLink("/x\"><script>"), "/");
  assert.equal(safeLink(undefined), "/");
});
