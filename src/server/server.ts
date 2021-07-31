import http from "http";
import fs from "fs";
import path from "path";
import getPort from "get-port";
import URL from "url";
import { parseBody } from "./utils";
import { getIframe } from "./iframe";
import { getLocalFileType, getPackageTypes } from "./types";

export async function createServer() {
  const port = await getPort({ port: +(process.env.PORT || 3000) });

  const server = http
    .createServer(async (req, res) => {
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
      };

      const { method: _method } = req;
      const { pathname, query } = URL.parse(req.url || "", true);

      const method = _method?.toLowerCase() || "";

      // Bundled iframe
      if (pathname === "/api/iframe" && method === "post") {
        const body = await parseBody<{ source: string }>(req);
        const iframe = await getIframe(body.source);

        if (iframe) {
          res.writeHead(200, { ...headers, "Content-Type": "text/html" });
          return res.end(iframe);
        } else {
          res.writeHead(400, headers);
          return res.end("Bad source code");
        }
      }

      // Get local file types
      if (pathname === "/api/types/local" && query.path) {
        const types = await getLocalFileType(String(query.path));

        if (types) {
          res.writeHead(200, headers);
          return res.end(types);
        }
      }

      // Get package types
      if (pathname?.includes("/api/types/") && method === "get") {
        const pkg = pathname.replace("/api/types/", "").replace(/\/$/, "");
        if (pkg.length) {
          const types = await getPackageTypes(pkg);

          if (types) {
            res.writeHead(200, headers);
            return res.end(types);
          }
        }
      }

      // Static serve
      const fileUri = req.url === "/" ? "/index.html" : req.url;
      try {
        const data = await fs.promises.readFile(
          path.resolve(__dirname, `../public${fileUri}`)
        );

        res.writeHead(200);
        return res.end(data);
      } catch (e) {
        console.error(`File not found: ${fileUri}`);
      }

      res.writeHead(404, headers);
      res.end("Not found");
    })
    .listen(port);

  server.on("listening", () => {
    console.info(`Start listening on http://localhost:${port}`);
  });
}
