import mri from "mri";
import http from "http";
import serveHandler from "serve-handler";
import { getConfig } from "./config";
import { generateTypes } from "./local-types";
import {
  copyPublicAssets,
  getSandboxDir,
  writeGeneratedAssets,
} from "./assets";

/** Build sandbox */
async function buildSandbox() {
  // Create sandbox directory
  const sandboxOutDir = await getSandboxDir();

  // Get config
  const config = await getConfig();

  // Generate types
  const localTypes = await generateTypes();

  // Get public assets (html, etc)
  await copyPublicAssets(sandboxOutDir);

  // Write generated assets (config, types)
  await writeGeneratedAssets(sandboxOutDir, { config, localTypes });

  console.log("Done! Your sandbox is created at '.sandbox' folder");
  return { sandboxOutDir };
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

/** Serve sandbox from .sandbox */
function serveSandbox(port: string, sandboxDir: string) {
  const server = http.createServer((request, response) => {
    return serveHandler(request, response, {
      public: sandboxDir,
    });
  });

  server.listen(port, () => {
    console.log(`Running at http://localhost:${port}`);
  });
}

function showVersion() {
  try {
    const pkg = require("./package.json");
    console.log(`Version: ${pkg.version}`);
  } catch (e) {
    console.log("Unknown version");
  }
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
      return buildSandbox();
    case "serve":
      const { sandboxOutDir } = await buildSandbox();
      return serveSandbox(args.port, sandboxOutDir);
    case "version":
      return showVersion();
    default:
      return showHelp();
  }
}
