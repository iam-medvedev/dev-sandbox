import { build } from "esbuild";

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

export async function getIframe(raw: string) {
  try {
    const bundle = await build({
      bundle: true,
      write: false,
      minify: true,
      sourcemap: false,
      outdir: "out",
      sourceRoot: process.cwd(),
      stdin: {
        contents: raw,
        sourcefile: "source.ts",
        loader: "tsx",
        resolveDir: process.cwd(),
      },
      format: "cjs",
    });

    const result = bundle.outputFiles.map((files) => files.text);
    return iframeTemplate(result.join(""));
  } catch (e) {
    return null;
  }
}
