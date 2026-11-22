import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LAYER_RANK = {
  domain: 0,
  engine: 1,
  framework: 2,
  render: 2,
  app: 3
};

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8"));
}

function walkFiles(dirs, exts, ignoreDirs) {
  const results = [];
  function visit(absDir) {
    if (!fs.existsSync(absDir)) {
      return;
    }
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (ignoreDirs.includes(entry.name)) {
        continue;
      }
      const full = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
      } else if (exts.includes(path.extname(entry.name))) {
        results.push(path.relative(ROOT, full).replace(/\\/g, "/"));
      }
    }
  }
  for (const dir of dirs) {
    visit(path.join(ROOT, dir));
  }
  return results.sort();
}

function scanComments(relPath, content, allowedPrefixes) {
  const issues = [];
  const lines = content.split("\n");
  let inBlock = false;
  let inQuote = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (let j = 0; j < line.length; j += 1) {
      const ch = line[j];
      const next = line[j + 1];
      if (inBlock) {
        if (ch === "*" && next === "/") {
          inBlock = false;
          j += 1;
        }
        continue;
      }
      if (inQuote) {
        if (ch === "\\") {
          j += 1;
        } else if (ch === inQuote) {
          inQuote = null;
        }
        continue;
      }
      if (ch === "\"" || ch === "'" || ch === "`") {
        inQuote = ch;
        continue;
      }
      if (ch === "/" && next === "/") {
        const body = line.slice(j + 2).trim();
        const allowed = allowedPrefixes.some((prefix) => body.startsWith(prefix));
        if (!allowed) {
          issues.push(`${relPath}:${i + 1} Disallowed comment`);
        }
        break;
      }
      if (ch === "/" && next === "*") {
        const body = line.slice(j + 2).trim();
        const allowed = allowedPrefixes.some((prefix) => body.startsWith(prefix));
        if (!allowed) {
          issues.push(`${relPath}:${i + 1} Disallowed block comment`);
        }
        inBlock = true;
        j += 1;
      }
    }
    if (inQuote !== "`") {
      inQuote = null;
    }
  }
  return issues;
}

function scanFunctionLengths(relPath, content, maxFnLines) {
  const issues = [];
  const lines = content.split("\n");
  const fnPattern = /\bfunction\s+[A-Za-z0-9_$]*\s*\(/;

  for (let i = 0; i < lines.length; i += 1) {
    if (!fnPattern.test(lines[i])) {
      continue;
    }
    let depth = 0;
    let opened = false;
    let endLine = i;
    for (let j = i; j < lines.length; j += 1) {
      for (const ch of lines[j]) {
        if (ch === "{") {
          depth += 1;
          opened = true;
        } else if (ch === "}") {
          depth -= 1;
        }
      }
      endLine = j;
      if (opened && depth === 0) {
        break;
      }
    }
    const span = endLine - i + 1;
    if (span > maxFnLines) {
      issues.push(`${relPath}:${i + 1} Function length ${span} exceeds limit ${maxFnLines}`);
    }
  }
  return issues;
}

function runSlopGuard(config, constraints, files) {
  const violations = [];
  for (const relPath of files) {
    const content = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    const lineCount = content.split("\n").length;
    if (lineCount > config.slopPolicy.maxFileLines) {
      violations.push(`${relPath}: File length ${lineCount} exceeds limit ${config.slopPolicy.maxFileLines}`);
    }
    if (config.slopPolicy.banComments) {
      violations.push(...scanComments(relPath, content, config.slopPolicy.allowedCommentPrefixes));
    }
    violations.push(...scanFunctionLengths(relPath, content, config.slopPolicy.maxFunctionLines));

    for (const rule of constraints.rules) {
      const excluded = (rule.excludeDirs || []).some((dir) => relPath.startsWith(`${dir}/`) || relPath === dir);
      if (excluded) {
        continue;
      }
      const regex = new RegExp(rule.pattern, "g");
      if (regex.test(content)) {
        violations.push(`${relPath}: Violated rule '${rule.id}' — ${rule.message}`);
      }
    }
  }
  return violations;
}

function runBoundaryGuard(files) {
  const violations = [];
  const importRegex = /from\s+["']([^"']+)["']/g;

  for (const relPath of files) {
    if (!relPath.startsWith("src/")) {
      continue;
    }
    const sourceLayer = relPath.split("/")[1];
    const sourceRank = LAYER_RANK[sourceLayer];
    if (sourceRank === undefined) {
      continue;
    }
    const content = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    let match = importRegex.exec(content);
    while (match) {
      const spec = match[1];
      if (spec.startsWith(".")) {
        const resolved = path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, relPath)), spec)).replace(/\\/g, "/");
        if (resolved.startsWith("src/")) {
          const targetLayer = resolved.split("/")[1];
          const targetRank = LAYER_RANK[targetLayer];
          if (targetRank !== undefined && targetRank > sourceRank) {
            violations.push(`${relPath}: Illegal upward import '${resolved}' (${sourceLayer} -> ${targetLayer})`);
          }
          if (sourceLayer === "render" && targetLayer === "framework") {
            violations.push(`${relPath}: Illegal cross-layer import '${resolved}' (render -> framework)`);
          }
        }
      }
      match = importRegex.exec(content);
    }
  }
  return violations;
}

function runFeatureMapGuard(featureMap, srcFiles) {
  const violations = [];
  const mapped = new Set();
  for (const feat of featureMap.features || []) {
    for (const f of feat.files || []) {
      mapped.add(f);
      if (!fs.existsSync(path.join(ROOT, f))) {
        violations.push(`feature-map.json: Missing declared file '${f}' in feature '${feat.id}'`);
      }
    }
  }
  for (const src of srcFiles) {
    if (!mapped.has(src)) {
      violations.push(`feature-map.json: Unmapped source file '${src}'`);
    }
  }
  return violations;
}

function runTests() {
  try {
    const out = execFileSync(process.execPath, ["--test", "tests/simulation.test.mjs", "tests/factory.test.mjs"], {
      cwd: ROOT,
      encoding: "utf8"
    });
    return { ok: true, output: out };
  } catch (err) {
    return { ok: false, output: `${err.stdout || ""}\n${err.stderr || ""}`.trim() };
  }
}

function writeVerificationBundle(summary) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(ROOT, "artifacts", "verifications", `verify-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(summary, null, 2));

  const md = [
    `# Verification Report — ${stamp}`,
    "",
    `- Overall Status: **${summary.ok ? "PASS" : "FAIL"}**`,
    `- Slop Guard Violations: ${summary.checks.slopGuard.violations.length}`,
    `- Boundary Guard Violations: ${summary.checks.boundaryGuard.violations.length}`,
    `- Feature Map Violations: ${summary.checks.featureMap.violations.length}`,
    `- Tests Passed: ${summary.checks.tests.ok}`,
    "",
    "## Test Output",
    "```",
    summary.checks.tests.output.trim(),
    "```"
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "report.md"), md);
  return path.relative(ROOT, outDir);
}

function main() {
  const cmd = process.argv[2] || "check";
  const config = readJson("factory.config.json");
  const constraints = readJson("rules/constraints.json");
  const featureMap = readJson("feature-map.json");
  const scanDirs = Array.from(new Set([...config.scan.includeDirs, "bin"]));
  const files = walkFiles(scanDirs, config.scan.extensions, config.scan.ignoreDirs);
  const srcFiles = files.filter((f) => f.startsWith("src/"));

  const slopViolations = runSlopGuard(config, constraints, files);
  const boundaryViolations = runBoundaryGuard(srcFiles);
  const mapViolations = runFeatureMapGuard(featureMap, srcFiles);
  const staticOk = slopViolations.length === 0 && boundaryViolations.length === 0 && mapViolations.length === 0;

  if (cmd === "check") {
    console.log(JSON.stringify({ ok: staticOk, scannedFiles: files.length, slopViolations, boundaryViolations, mapViolations }, null, 2));
    process.exit(staticOk ? 0 : 1);
  }

  if (cmd === "verify") {
    const testResult = runTests();
    const ok = staticOk && testResult.ok;
    const summary = {
      ok,
      timestamp: new Date().toISOString(),
      scannedFiles: files.length,
      checks: {
        slopGuard: { ok: slopViolations.length === 0, violations: slopViolations },
        boundaryGuard: { ok: boundaryViolations.length === 0, violations: boundaryViolations },
        featureMap: { ok: mapViolations.length === 0, violations: mapViolations },
        tests: testResult
      }
    };
    const artifactDir = writeVerificationBundle(summary);
    console.log(JSON.stringify({ ok, artifactDir, slopViolations, boundaryViolations, mapViolations, testsOk: testResult.ok }, null, 2));
    process.exit(ok ? 0 : 1);
  }

  console.error(`Unknown factory command: ${cmd}`);
  process.exit(1);
}

main();
