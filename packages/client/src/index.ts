import * as monaco from "monaco-editor";
import { initialCode } from "./initialCode";
import { debounce } from "./utils";

MonacoEnvironment = {
  getWorkerUrl: (moduleId, label) => {
    if (label === "json") {
      return "./json.worker.js";
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "./css.worker.js";
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "./html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

/** Get iframe source from server */
async function updateIframe(source: string) {
  const html = await fetch("http://localhost:3000/iframe", {
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

async function createEditor() {
  const container = document.getElementById("editor");

  if (!container) {
    throw new Error("Container is not found");
  }

  const debouncedRefreshIframe = debounce(updateIframe, 1000);

  const model = monaco.editor.createModel(initialCode, "typescript");
  const editor = monaco.editor.create(container, { model });

  editor.onDidChangeModelContent(async () => {
    const errors = await getModelErrors(model);
    if (!errors.length) {
      debouncedRefreshIframe(editor.getValue());
    }
  });
}

createEditor();
