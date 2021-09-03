import mri from "mri";
import http from "http";
import boxen from "boxen";
import Listr from "listr";
import serveHandler from "serve-handler";
import { getConfig } from "./config";
import { generateTypes } from "./local-types";
import {
  copyPublicAssets,
  getSandboxDir,
  writeGeneratedAssets,
} from "./assets";
import type { Config } from "../types";

type ListContext = {
  sandboxOutDir: string;
  config: Config;
  localTypes: Record<string, string>;
};

function showBox(str: string) {
  console.log(boxen(str, { padding: 1 }));
}

function showHelp() {
  console.log(`
    Usage
      $ dev-sandbox build    Build sandbox in current directory
      $ dev-sandbox serve    Build and serve sandbox

    Options
      --port, -p             Custom port for serving sandbox (default: 5000)

    Examples
      $ dev-sandbox build
      $ dev-sandbox serve
      $ dev-sandbox serve --port 8080
  `);
}

function showVersion() {
  try {
    const pkg = require("./package.json");
    console.log(`Version: ${pkg.version}`);
  } catch (e) {
    console.log("Unknown version");
  }
}

/** Build sandbox */
async function buildSandbox() {
  const tasks = new Listr<ListContext>([
    {
      title: "Create sandbox directory",
      task: async (ctx) => {
        ctx.sandboxOutDir = await getSandboxDir();
      },
    },
    {
      title: "Get config",
      task: async (ctx) => {
        ctx.config = await getConfig();
      },
    },
    {
      title: "Generate types",
      task: async (ctx) => {
        ctx.localTypes = await generateTypes();
      },
    },
    {
      title: "Copying public assets",
      task: async (ctx) => {
        await copyPublicAssets(ctx.sandboxOutDir);
      },
    },
    {
      title: "Copying generated assets",
      task: async (ctx) => {
        await writeGeneratedAssets(ctx.sandboxOutDir, {
          config: ctx.config,
          localTypes: ctx.localTypes,
        });
      },
    },
  ]);

  const result = await tasks.run();

  return { sandboxOutDir: result.sandboxOutDir };
}

/** Serve sandbox from .sandbox */
function serveSandbox(port: string, sandboxDir: string) {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      return serveHandler(request, response, {
        public: sandboxDir,
      });
    });

    server.listen(port, () => {
      resolve(true);
    });
  });
}

/** CLI entrypoint */
export async function start() {
  const argv = process.argv.slice(2);
  const args = mri(argv, {
    string: ["port"],
    default: {
      port: "5000",
    },
  });

  const command = args._[0];

  switch (command) {
    case "build":
      await buildSandbox();
      return showBox("Done! Your sandbox is created at '.sandbox' folder");
    case "serve":
      const { sandboxOutDir } = await buildSandbox();
      await serveSandbox(args.port, sandboxOutDir);
      return showBox(
        `Done! Your sandbox is running at http://localhost:${args.port}`
      );
    case "version":
      return showVersion();
    default:
      return showHelp();
  }
}
