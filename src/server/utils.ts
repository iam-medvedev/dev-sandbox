import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import findNodeModules from "find-node-modules";

export function parseBody<T extends object>(
  req: http.IncomingMessage
): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function getTmpPath(pathname?: string) {
  const tmpDir = os.tmpdir();
  return pathname ? path.resolve(tmpDir, pathname) : tmpDir;
}

export function getNodeModulesPath(cwd: string) {
  const paths = findNodeModules({ cwd, relative: false });
  return (paths.length && paths[0]) || null;
}

export type PackageJson = {
  types?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

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
