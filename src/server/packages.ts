import path from "path";
import fs from "fs";
import findNodeModules from "find-node-modules";
import {
  bundle as dtsBundle,
  Options as DTSOptions,
} from "dts-bundle/lib/index";
import { getTmpPath } from "./utils";

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

function getNodeModulesPath(cwd: string) {
  const paths = findNodeModules({ cwd, relative: false });
  return (paths.length && paths[0]) || null;
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
            name,
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
