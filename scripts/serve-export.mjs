import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const exportRoot = resolve(fileURLToPath(new URL("../out/", import.meta.url)));
const portIndex = process.argv.findIndex((argument) => argument === "--port" || argument === "-p");
const port = Number(
  portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT ?? 3000,
);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".vcf", "text/vcard; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

async function findExportFile(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  if (decodedPath.includes("\\") || decodedPath.includes("\0")) return null;

  const segments = decodedPath.split("/").filter(Boolean);
  const target = resolve(exportRoot, ...segments);
  const relativePath = relative(exportRoot, target);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    relativePath === "." && segments.length > 0
  ) return null;

  const candidates = decodedPath.endsWith("/")
    ? [resolve(target, "index.html")]
    : [target, `${target}.html`, resolve(target, "index.html")];

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

try {
  await stat(resolve(exportRoot, "index.html"));
} catch {
  process.stderr.write("Static export not found. Run npm run build first.\n");
  process.exit(1);
}

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  process.stderr.write("Port must be an integer between 0 and 65535.\n");
  process.exit(1);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  let filePath;
  try {
    filePath = await findExportFile(pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  const status = filePath ? 200 : 404;
  if (!filePath) filePath = resolve(exportRoot, "404.html");

  try {
    const fileStat = await stat(filePath);
    response.writeHead(status, {
      "Cache-Control": pathname.startsWith("/_next/static/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "Content-Length": fileStat.size,
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  const activePort = typeof address === "object" && address ? address.port : port;
  process.stdout.write(`Static export available at http://localhost:${activePort}\n`);
});
