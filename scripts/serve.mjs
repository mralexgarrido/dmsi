import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number.parseInt(process.env.DMSI_PORT ?? "4173", 10);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
    const requestedPath = path.resolve(projectRoot, relativePath);

    if (!requestedPath.startsWith(`${projectRoot}${path.sep}`)) {
      sendNotFound(response);
      return;
    }

    let filePath = requestedPath;
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendNotFound(response);
  }
});

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

server.listen(port, "0.0.0.0", () => {
  console.log(`DMSI development server: http://127.0.0.1:${port}`);
});
