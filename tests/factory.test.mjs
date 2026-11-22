import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("factory:check passes with zero slop, boundary, or feature-map violations", () => {
  const output = execFileSync(process.execPath, ["bin/factory.mjs", "check"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.slopViolations, []);
  assert.deepEqual(parsed.boundaryViolations, []);
  assert.deepEqual(parsed.mapViolations, []);
});
