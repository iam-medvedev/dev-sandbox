import ora from "ora";
import { build } from "esbuild";
import path from "path";
import fs from "fs";

const publicAssets = ["index.html", "iframe.html", "main.css", "sw.js"].map(
  (filename) => ({
    filename,
    path: path.resolve(__dirname, `../src/sandbox/public/${filename}`),
  })
);

/** Build sandbox */
async function buildSandbox() {
  const spinner = ora("Compiling html...").start();
  const outdir = path.resolve(__dirname, "../dist/sandbox");

  await build({
    minify: true,
    bundle: true,
    entryPoints: {
      sandbox: path.resolve(__dirname, "../src/sandbox/index.ts"),
    },
    outdir,
    loader: {
      ".ts": "ts",
      ".eot": "file",
      ".woff": "file",
      ".woff2": "file",
      ".svg": "file",
      ".ttf": "file",
    },
  }).catch((e) => console.error(e.message));

  // Copy assets
  for (const asset of publicAssets) {
    await fs.promises.copyFile(
      asset.path,
      path.resolve(outdir, `./${asset.filename}`)
    );
  }

  spinner.succeed("💫 Sandbox html compiled!");
}

buildSandbox();
