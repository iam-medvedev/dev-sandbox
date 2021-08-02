import http from "http";
import fs from "fs";
import path from "path";
import getPort from "get-port";
import URL from "url";
import ora from "ora";
import exitHook from "exit-hook";
import { parseBody } from "./utils";
import { getIframeSource } from "./iframe";
import { generateTypes } from "./typegen";
import { getPackageTypes } from "./types";

type ServerOpts = {
  types?: Record<string, string>;
};

async function createServer(opts: ServerOpts = {}) {
  const spinner = ora("Starting server").start();
  const port = await getPort({ port: +(process.env.PORT || 3000) });

  const server = http
    .createServer(async (req, res) => {
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
      };

      const { pathname } = URL.parse(req.url || "", true);
      const method = req.method?.toLowerCase() || "";

      // Api for source builder
      if (pathname === "/api/iframe" && method === "post") {
        const body = await parseBody<{ source: string }>(req);
        const iframe = await getIframeSource(body.source);

        if (iframe) {
          res.writeHead(200, { ...headers, "Content-Type": "text/html" });
          return res.end(iframe);
        } else {
          res.writeHead(400, headers);
          return res.end("Bad source code");
        }
      }

      // Serve typescript declarations
      if (opts.types) {
        if (pathname === "/types/local") {
          res.writeHead(200, {
            ...headers,
            "Content-Type": "application/json",
          });
          return res.end(JSON.stringify(opts.types));
        } else if (pathname?.startsWith("/types/")) {
          try {
            // Get types for local dependency or package
            const dts = await getPackageTypes(pathname.replace("/types/", ""));

            if (dts) {
              res.writeHead(200, {
                ...headers,
                "Content-Type": "text/plain",
              });
              return res.end(dts);
            }
          } catch (e) {}
        }
      }

      // Server editor files
      const fileUri = pathname === "/" ? "/index.html" : pathname;
      try {
        const data = await fs.promises.readFile(
          path.resolve(__dirname, `../public${fileUri}`)
        );

        res.writeHead(200);
        return res.end(data);
      } catch (e) {}

      res.writeHead(404, headers);
      res.end("Not found");
    })
    .listen(port);

  server.on("listening", () => {
    spinner.succeed(`Server listening on http://localhost:${port}`);
  });
}

/**
 * Main entrypoint
 */
export async function start() {
  // Generate types
  const { typesPath, types } = await generateTypes();

  // Cleanup
  exitHook(() => {
    if (typesPath) {
      fs.rmdirSync(typesPath, { recursive: true });
    }
  });

  // Start server
  createServer({
    types,
  });
}
