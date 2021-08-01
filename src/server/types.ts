import path from "path";
import * as ts from "typescript";
import fs from "fs";
import { bundle as dtsBundle, Options as DTSOptions } from "dts-bundle";
import { getNodeModulesPath, getTmpPath } from "./utils";

type PackageJson = {
  types?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

async function getPackageJson(packageJsonPath: string) {
  if (fs.existsSync(packageJsonPath)) {
    try {
      const data = await fs.promises.readFile(packageJsonPath, "utf-8");
      const json = JSON.parse(data) as PackageJson;
      return json;
    } catch (err) {
      console.error("Something wrong with your package.json");
    }
  } else {
    console.error("package.json is not exists in current folder");
  }
}

/** Getting package types (node_modules/package or node_modules/@types/package) */
export async function getPackageTypes(name: string): Promise<string | null> {
  const currentDir = process.cwd();
  const packageJson = await getPackageJson(
    path.resolve(currentDir, "package.json")
  );

  if (packageJson) {
    const packages = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    if (Object.keys(packages) && packages.hasOwnProperty(name)) {
      const nodeModulesPath = getNodeModulesPath(currentDir);
      if (nodeModulesPath) {
        const pkgDir = path.resolve(nodeModulesPath, `./${name}`);
        const pkgPackageJson = await getPackageJson(
          path.resolve(pkgDir, "package.json")
        );

        // If types exists, return it
        if (pkgPackageJson?.types) {
          const typesPath = path.resolve(pkgDir, pkgPackageJson.types);
          const dtsTmpPath = getTmpPath(`${name}.d.ts`);

          // Generate d.ts of package in temp dir
          dtsBundle({
            main: typesPath,
            name: name.replace("@types/", ""),
            out: dtsTmpPath,
          } as DTSOptions);

          const result = await fs.promises.readFile(dtsTmpPath, "utf-8");

          // Remove temp file
          await fs.promises.unlink(dtsTmpPath);

          return result;
        } else {
          // Trying to find @types/package
          return getPackageTypes(`@types/${name}`);
        }
      }
    } else if (!name.includes("@types/")) {
      // Trying to find @types/package
      return getPackageTypes(`@types/${name}`);
    }
  }

  return null;
}

function normalizeFilePath(file: string): string | null {
  // If file has extension, check it full path
  if (path.extname(file)) {
    if (fs.existsSync(file)) {
      return file;
    }

    return null;
  }

  // If file has no extension, we need to check it again with our extensions
  const availableFilePaths = ["ts", "tsx", "js", "jsx"].map(
    (ext) => `${file}.${ext}`
  );
  const filePathWithExt = availableFilePaths.find((el) => fs.existsSync(el));
  if (filePathWithExt) {
    return filePathWithExt;
  }

  // If we didn't find anything, then we will try to find path/index file
  if (!file.endsWith("/index")) {
    return normalizeFilePath(`${file}/index`);
  }

  return null;
}

/** Get file types from root */
export async function getLocalFileType(filePath: string) {
  const currentDir = process.cwd();
  const dtsTmpPath = getTmpPath(`${Date.now()}.d.ts`);

  // Emit types of local file to temp dir
  const file = normalizeFilePath(path.resolve(currentDir, `./${filePath}`));
  if (!file) {
    return null;
  }

  const program = ts.createProgram([file], {
    declaration: true,
    emitDeclarationOnly: true,
    outFile: dtsTmpPath,
  });
  program.emit();

  const dts = await fs.promises.readFile(dtsTmpPath, "utf-8");

  // Remove temp file
  await fs.promises.unlink(dtsTmpPath);

  if (!dts) {
    return null;
  }

  // Remove "declare module" wrapper
  const lines = dts.split("\n");
  const declareLineIndex = lines.findIndex((line) =>
    line.includes("declare module")
  );
  if (declareLineIndex > -1) {
    lines.splice(declareLineIndex, 1);
  }
  if (lines[lines.length - 1] === "") {
    lines.splice(-1, 1);
  }
  if (lines[lines.length - 1] === "}") {
    lines.splice(-1, 1);
  }

  return lines.join("\n");
}
