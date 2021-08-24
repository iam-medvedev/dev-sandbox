import type { PackageJson } from "type-fest";
import path from "path";
import fs from "fs";
import { bundle as dtsBundle } from "dts-bundle";
import { getNodeModulesPath, getPackageJson, getTmpPath } from "./utils";

const currentDir = process.cwd();

export async function getTypes(packageJson: PackageJson, name: string) {
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
        const typings = pkgPackageJson?.types || pkgPackageJson?.typings;
        if (typings) {
          const typesPath = path.resolve(pkgDir, typings);
          const dtsTmpPath = getTmpPath(`${name}.d.ts`);

          // Generate d.ts of package in temp dir
          dtsBundle({
            main: typesPath,
            name: name.replace("@types/", ""),
            out: dtsTmpPath,
          });

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

/** Getting package types (node_modules/package or node_modules/@types/package) */
export async function getPackageTypes(name: string): Promise<string | null> {
  const packageJson = await getPackageJson(
    path.resolve(currentDir, "package.json")
  );

  if (packageJson) {
    return getTypes(packageJson, name);
  }

  return null;
}
