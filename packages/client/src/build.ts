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
    "editor.worker": "monaco-editor/esm/vs/editor/editor.worker.js",
    "json.worker": "monaco-editor/esm/vs/language/json/json.worker",
    "css.worker": "monaco-editor/esm/vs/language/css/css.worker",
    "html.worker": "monaco-editor/esm/vs/language/html/html.worker",
    "ts.worker": "monaco-editor/esm/vs/language/typescript/ts.worker",
  },
  bundle: true,
  outdir: path.resolve(__dirname, "../public"),
  loader: {
    ".ts": "ts",
    ".eot": "file",
    ".woff": "file",
    ".woff2": "file",
    ".svg": "file",
    ".ttf": "file",
  },
}).catch((e) => console.error(e.message));
