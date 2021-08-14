import http from "http";
import fs from "fs";
import getPort from "get-port";
import ora from "ora";
import exitHook from "exit-hook";
import { cosmiconfig } from "cosmiconfig";
import { parseBody } from "./utils";
import { getIframeSource } from "./iframe";
import { generateTypes } from "./typegen";
import { getPackageTypes } from "./types";
import Router, { RouteHandler } from "./router";

export type Config = {
  initialCode: string;
  typescript: boolean;
};

type ServerOpts = {
  types?: Record<string, string>;
};

/** Get iframe source code */
const getIframeSourceCode: RouteHandler = async (req, res) => {
  const body = await parseBody<{ source: string }>(req);
  const iframe = await getIframeSource(body.source);

  if (iframe) {
    return res.send(iframe, 200, "text/html");
  } else {
    return res.send("Bad source code", 400);
  }
};

/** Get project config */
const getConfig: RouteHandler = async (req, res) => {
  const configExplorer = cosmiconfig("sandbox");
  const result = await configExplorer.search();

  const config: Config = {
    initialCode: `// Write your code here`,
    typescript: true,
    ...(result?.config || {}),
  };

  res.json(config);
};

/** Get parsed types for all local files */
const getTypes = (types: Record<string, string>): RouteHandler => {
  return (req, res) => {
    res.json(types);
  };
};

/** Get types for local package */
const getTypesForPackage: RouteHandler<{ pkgName: string }> = async (
  req,
  res
) => {
  try {
    const dts = await getPackageTypes(req.params.pkgName);
    if (dts) {
      res.send(dts);
    } else {
      res.json({ error: "Not Found" }, 404);
    }
  } catch (e) {
    res.json({ error: "An error occured" }, 500);
  }
};

async function createServer(opts: ServerOpts = {}) {
  const spinner = ora("Starting server").start();
  const port = await getPort({ port: +(process.env.PORT || 3000) });

  const router = new Router();
  router.post("/api/iframe", getIframeSourceCode);
  router.get("/api/config", getConfig);

  if (opts.types) {
    router.get("/api/types/local", getTypes(opts.types));
    router.get("/api/types/:pkgName", getTypesForPackage);
  }

  const server = http
    .createServer(async (req, res) => {
      await router.run(req, res);
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
