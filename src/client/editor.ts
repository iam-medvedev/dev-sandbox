import * as monaco from "monaco-editor";
import parseImports from "parse-es6-imports";
import { initialCode } from "./initialCode";
import { debounce } from "./utils";

MonacoEnvironment = {
  getWorkerUrl: (moduleId, label) => {
    if (label === "json") {
      return "./assets/json.worker.js";
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "./assets/css.worker.js";
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "./assets/html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./assets/ts.worker.js";
    }
    return "./assets/editor.worker.js";
  },
};

/** Get iframe source from server */
async function refreshIframe(source: string) {
  const html = await fetch("/api/iframe", {
    method: "POST",
    body: JSON.stringify({
      source,
    }),
  }).then((res) => res.text());

  let iframe = document.getElementById("iframe") as HTMLIFrameElement;
  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(html);
  iframe.contentWindow?.document.close();
}

/** Get errors from editor */
async function getModelErrors(model: monaco.editor.ITextModel) {
  if (!model || model.isDisposed()) return [];

  const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
  const worker = await getWorker(model.uri);

  const errors = (
    await Promise.all([
      worker.getSyntacticDiagnostics(model.uri.toString()),
      worker.getSemanticDiagnostics(model.uri.toString()),
    ])
  ).reduce((result, er) => result.concat(er));

  return errors;
}

/** Load dependencies and update it in editor */
async function loadDependencies(source: string) {
  const imports = parseImports(source);
  const packages = imports.filter((el) => !el.fromModule.includes("/"));

  const libs = monaco.languages.typescript.typescriptDefaults.getExtraLibs();

  for await (const pkg of packages) {
    const pkgName = pkg.fromModule;
    const fileName = `file:///node_modules/${pkgName}`;

    if (libs && libs[fileName]) {
      continue;
    }

    const dtsRaw = await fetch(`/api/types/${pkgName}`).then((res) =>
      res.text()
    );
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      dtsRaw,
      fileName
    );
  }
}

/** Creates editor and get dependencies */
export async function createEditor() {
  const container = document.getElementById("editor");

  if (!container) {
    throw new Error("Container is not found");
  }

  const debouncedRefreshIframe = debounce(refreshIframe, 1000);
  const debouncedLoadDependencies = debounce(loadDependencies, 1000);

  const model = monaco.editor.createModel(initialCode, "typescript");
  const editor = monaco.editor.create(container, { model });

  // Immediate refresh iframe and get dependencies
  loadDependencies(model.getValue());
  refreshIframe(model.getValue());

  // On change callback
  editor.onDidChangeModelContent(async () => {
    const errors = await getModelErrors(model);

    if (errors.length) {
      debouncedLoadDependencies(model.getValue());
    }

    if (!errors.length) {
      debouncedRefreshIframe(model.getValue());
    }
  });
}
