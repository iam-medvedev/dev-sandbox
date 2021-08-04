import { build } from "esbuild";
import { getNodeModulesPath } from "./utils";

function iframeTemplate(bundledCode: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
    </head>
    <body>
      <div id="app"></div>
      <script>${bundledCode}</script>
    </body>
    </html>
  `;
}

/** Build source code and bundle it in .html file for iframe */
export async function getIframeSource(source: string) {
  try {
    const currentDir = process.cwd();
    const nodeModulesPath = getNodeModulesPath(currentDir);
    const nodePaths = nodeModulesPath ? [nodeModulesPath] : [];

    const bundle = await build({
      bundle: true,
      write: false,
      minify: true,
      sourcemap: false,
      outdir: "out",
      sourceRoot: process.cwd(),
      stdin: {
        contents: source,
        sourcefile: "source.ts",
        loader: "tsx",
        resolveDir: process.cwd(),
      },
      format: "cjs",
      nodePaths,
    });

    const result = bundle.outputFiles.map((files) => files.text);
    return iframeTemplate(result.join(""));
  } catch (e) {
    return null;
  }
}
