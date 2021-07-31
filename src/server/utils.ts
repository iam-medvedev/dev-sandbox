import http from "http";
import os, { tmpdir } from "os";
import path from "path";

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
