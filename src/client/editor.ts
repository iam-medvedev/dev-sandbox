import type { editor } from "monaco-editor";
import parseImports from "parse-es6-imports";
import { initialCode } from "./initialCode";
import { debounce } from "./utils";

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
async function getModelErrors(model: editor.ITextModel) {
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

  const libs = monaco.languages.typescript.typescriptDefaults.getExtraLibs();

  for await (const pkg of imports) {
    const pkgName = pkg.fromModule;
    const isPackage = !pkgName.includes("/");
    const fileName = monaco.Uri.file(`${pkgName}.d.ts`).toString();

    if (libs && libs[fileName]) {
      continue;
    }

    const fetchUrl = isPackage
      ? `/api/types/${pkgName}`
      : `/api/types/local?path=${pkgName}`;

    const dtsRaw = await fetch(fetchUrl).then((res) => res.text());

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

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
  });

  const debouncedRefreshIframe = debounce(refreshIframe, 400);
  const debouncedLoadDependencies = debounce(loadDependencies, 400);

  const uri = monaco.Uri.file("/index.tsx");
  const model = monaco.editor.createModel(initialCode, "typescript", uri);
  const editor = monaco.editor.create(container, {
    model,
    minimap: {
      enabled: false,
    },
  });

  // Immediate refresh iframe and get dependencies
  loadDependencies(model.getValue());
  refreshIframe(model.getValue());

  // On change callback
  editor.onDidChangeModelContent(async () => {
    const errors = await getModelErrors(model);

    if (errors.length) {
      debouncedLoadDependencies(model.getValue());
      debouncedRefreshIframe(model.getValue());
    }

    if (!errors.length) {
      debouncedRefreshIframe(model.getValue());
    }
  });

  // Bind key events
  document.addEventListener(
    "keydown",
    (e) => {
      // cmd + s
      if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {
        e.preventDefault();
        refreshIframe(model.getValue());
      }
    },
    false
  );
}
