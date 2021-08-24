import type { PackageJson } from "type-fest";
import fs from "fs";
import os from "os";
import path from "path";
import findNodeModules from "find-node-modules";

export function getTmpPath(pathname?: string) {
  const tmpDir = os.tmpdir();
  return pathname ? path.resolve(tmpDir, pathname) : tmpDir;
}

export function getNodeModulesPath(cwd: string) {
  const paths = findNodeModules({ cwd, relative: false });
  return (paths.length && paths[0]) || null;
}

export async function getPackageJson(packageJsonPath: string) {
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
