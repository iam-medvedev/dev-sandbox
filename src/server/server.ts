import http from "http";
import fs from "fs";
import path from "path";
import getPort from "get-port";
import { parseBody } from "./utils";
import { getIframe } from "./iframe";
import { getPackageTypes } from "./packages";

export async function createServer() {
  const port = await getPort({ port: +(process.env.PORT || 3000) });

  const server = http
    .createServer(async (req, res) => {
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
        "Access-Control-Max-Age": 2592000,
      };

      const { method: _method, url } = req;
      const method = _method?.toLowerCase() || "";

      // Bundled iframe
      if (url === "/api/iframe" && method === "post") {
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

      // Get package types
      if (url?.includes("/api/types/") && method === "get") {
        const pkg = url.replace("/api/types/", "").replace(/\/$/, "");
        if (pkg.length) {
          const packageTypes = await getPackageTypes(pkg);

          if (packageTypes) {
            res.writeHead(200, { ...headers });
            return res.end(packageTypes);
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
