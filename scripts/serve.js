import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["index.html", "text/html"]],
  ["/index.html", ["index.html", "text/html"]],
  ["/styles.css", ["styles.css", "text/css"]],
  ["/icon.svg", ["icon.svg", "image/svg+xml"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/build.js", ["build.js", "text/javascript"]],
  ["/options.js", ["options.js", "text/javascript"]],
]);

const port = Number(process.env.PORT ?? 3001);

createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  const file = files.get(path);
  if (!file) {
    response.writeHead(404).end("File not found");
    return;
  }

  const [name, type] = file;
  try {
    const body = await readFile(new URL(`../public/${name}`, import.meta.url));
    response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }).end(body);
  } catch {
    response.writeHead(500).end("Could not read the requested file");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Pathfinder attribute calculator at http://127.0.0.1:${port}`);
});
