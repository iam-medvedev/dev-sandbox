import type { editor, languages } from "monaco-editor";
import type { Config } from "../server/server";
import parseImports from "parse-es6-imports";
import { debounce } from "./utils";

/** Get iframe source from server */
async function refreshIframe(source: string) {
  const html = await fetch("/api/iframe", {
    method: "POST",
    body: JSON.stringify({
      source,
    }),
  }).then((res) => res.text());

  const iframe = document.getElementById("iframe") as HTMLIFrameElement;
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

      const fetchUrl = `/api/types/${pkgName}`;
      const dts = await fetch(fetchUrl).then((res) => res.text());

      if (dts) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          dts,
          fileName
        );
      }
    })
  );
}

/** Loading typings for local files */
async function loadLocalTypes() {
  const dts = await fetch("/api/types/local").then((res) => res.json());

  for (const filename of Object.keys(dts)) {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      dts[filename],
      monaco.Uri.file(`./${filename}`).toString()
    );
  }
}

async function getConfig(): Promise<Config> {
  return await fetch("/api/config").then((res) => res.json());
}

/** Create monaco editor with provided config */
function createMonaco(container: HTMLElement, config: Config) {
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
  });

  return { model, editor };
}

/** Creates editor and get dependencies */
export async function createEditor() {
  const container = document.getElementById("editor");

  if (!container) {
    throw new Error("Container is not found");
  }
  const config = await getConfig();
  const { model, editor } = createMonaco(container, config);

  // Immediate refresh iframe and get dependencies
  loadLocalTypes();
  loadPackageTypes(model.getValue());
  refreshIframe(model.getValue());

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
      }
    },
    false
  );
}
