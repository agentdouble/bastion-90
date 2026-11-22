import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function parsePort(argv) {
  const idx = argv.indexOf("--port");
  if (idx !== -1 && argv[idx + 1]) {
    const parsed = Number(argv[idx + 1]);
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
      return parsed;
    }
  }
  return Number(process.env.PORT) || 4173;
}

function resolveFilePath(rawUrl) {
  const cleanPath = decodeURIComponent((rawUrl || "/").split("?")[0]);
  const relative = cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, "");
  const fullPath = path.resolve(ROOT, relative);
  if (!fullPath.startsWith(ROOT)) {
    return null;
  }
  return fullPath;
}

const port = parsePort(process.argv.slice(2));
const server = http.createServer((req, res) => {
  const target = resolveFilePath(req.url);
  if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  fs.createReadStream(target).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`BASTION 90 running at http://127.0.0.1:${port}`);
});
