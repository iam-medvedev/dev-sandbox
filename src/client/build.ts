import * as path from "path";
import { build } from "esbuild";

const isProduction = process.env.NODE_ENV === "production";

build({
  watch: isProduction
    ? false
    : {
        onRebuild(error) {
          if (!error) {
            console.log("Build succeeded");
          }
        },
      },
  entryPoints: {
    sandbox: path.resolve(__dirname, "index.ts"),
  },
  bundle: true,
  outdir: path.resolve(__dirname, "../public/assets"),
  loader: {
    ".ts": "ts",
    ".eot": "file",
    ".woff": "file",
    ".woff2": "file",
    ".svg": "file",
    ".ttf": "file",
  },
}).catch((e) => console.error(e.message));
