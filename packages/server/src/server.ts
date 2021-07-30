import http from "http";
import getPort from "get-port";
import { parseBody } from "./utils";
import { getEditor } from "./editor";
import { getIframe } from "./iframe";

export async function createServer() {
  const port = await getPort({ port: +(process.env.PORT || 3000) });

  const server = http
    .createServer(async (req, res) => {
      const { method: _method, url } = req;
      const method = _method?.toLowerCase() || "";

      // Editor html page
      if (url === "/" && method === "get") {
        const editor = await getEditor();

        res.statusCode = 200;
        return res.end(editor);
      }

      // Bundled iframe
      if (url === "/iframe" && method === "post") {
        const body = await parseBody<{ source: string }>(req);
        const iframe = await getIframe(body.source);

        if (iframe) {
          res.writeHead(200, { "Content-Type": "text/html" });
          return res.end(iframe);
        } else {
          res.statusCode = 400;
          return res.end("Bad source code");
        }
      }

      res.statusCode = 404;
      res.end("Not found");
    })
    .listen(port);

  server.on("listening", () => {
    console.info(`Start listening on http://localhost:${port}`);
  });
}
