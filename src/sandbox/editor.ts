import type { editor, languages } from "monaco-editor";
import parseImports from "parse-es6-imports";
import type { Config } from "../types";
import { configureFormatter } from "./formatter";
import { refreshIframe } from "./iframe";
import { debounce } from "./utils";

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
async function loadPackageTypes(source: string) {
  const imports = parseImports(source);

  const libs = monaco.languages.typescript.typescriptDefaults.getExtraLibs();

  await Promise.all(
    imports.map(async (pkg) => {
      const pkgName = pkg.fromModule;
      const isPackage = !pkgName.includes("/");

      if (!isPackage) {
        return;
      }

      const fileName = monaco.Uri.file(`${pkgName}.d.ts`).toString();
      if (libs && libs[fileName]) {
        return;
      }

      // const dts = await callApi(`/api/types/${pkgName}`).then((res) =>
      //   res.text()
      // );

      // if (dts) {
      //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
      //     dts,
      //     fileName
      //   );
      // }
    })
  );
}

/** Loading typings for local files */
async function loadLocalTypes() {
  // const dts = await callApi("/api/types/local").then((res) => res.json());
  // for (const filename of Object.keys(dts)) {
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     dts[filename],
  //     monaco.Uri.file(`./${filename}`).toString()
  //   );
  // }
}

/** Create monaco editor with provided config */
function initializeEditor(container: HTMLElement, config: Config) {
  if (config.typescript) {
    const typescriptConfig: languages.typescript.CompilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.Latest,
      jsx: monaco.languages.typescript.JsxEmit.React,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      allowNonTsExtensions: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      reactNamespace: "React",
      allowJs: true,
    };
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      typescriptConfig
    );
  }

  configureFormatter();

  const uri = monaco.Uri.file("/index.tsx");
  const model = monaco.editor.createModel(
    config.initialCode,
    config.typescript ? "typescript" : "javascript",
    uri
  );
  const editor = monaco.editor.create(container, {
    model,
    minimap: {
      enabled: false,
    },
    formatOnPaste: true,
    formatOnType: true,
    scrollbar: {
      verticalSliderSize: 4,
      verticalScrollbarSize: 8,
      horizontalSliderSize: 4,
      horizontalScrollbarSize: 8,
    },
  });

  return { model, editor };
}

function bindEvents(
  editor: editor.IStandaloneCodeEditor,
  model: editor.ITextModel
) {
  const debouncedRefreshIframe = debounce(refreshIframe, 400);
  const debouncedLoadDependencies = debounce(loadPackageTypes, 400);

  // On change callback
  editor.onDidChangeModelContent(async () => {
    const errors = await getModelErrors(model);

    if (errors.length) {
      await debouncedLoadDependencies(model.getValue());
      await debouncedRefreshIframe(model.getValue());
    }

    if (!errors.length) {
      await debouncedRefreshIframe(model.getValue());
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
        editor.getAction("editor.action.formatDocument").run();
      }
    },
    false
  );

  // Immediate refresh iframe and get dependencies
  loadLocalTypes();
  loadPackageTypes(model.getValue());
  refreshIframe(model.getValue());
}

/** Sandbox entrypoint */
export async function runSandbox() {
  const container = document.getElementById("editor");

  if (!container) {
    throw new Error("Container is not found");
  }

  const config: Config = window.sandboxConfig || {};
  const { model, editor } = await initializeEditor(container, config);

  bindEvents(editor, model);
}
