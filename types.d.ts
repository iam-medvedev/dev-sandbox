declare const monaco: typeof import("monaco-editor");

interface Window {
  runSandbox: typeof import("./src/sandbox/editor").runSandbox;
  sandboxConfig: import("./src/types").Config;
}

declare module "find-node-modules" {
  export default function (): string[];
  export default function (path?: string): string[];
  export default function (opts: {
    cwd?: string;
    relative?: boolean;
  }): string[];
}

declare module "parse-es6-imports" {
  type NamedImport = {
    name: string;
    value: string;
  };

  type ParsedImport = {
    defaultImport: string | null;
    namedImports: NamedImport[];
    starImport: string | null;
    fromModule: string;
  };
  export default function (code: string): ParsedImport[];
}
