import http from "http";
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

export function getTmpPath(filename: string) {
  const tmpDir = os.tmpdir();
  return path.resolve(tmpDir, `./${filename}`);
}

export function getNodeModulesPath(cwd: string) {
  const paths = findNodeModules({ cwd, relative: false });
  return (paths.length && paths[0]) || null;
}
