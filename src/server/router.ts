import type { IncomingMessage, ServerResponse } from "http";
import URL from "url";
import fs from "fs";
import path from "path";
import { match, MatchFunction } from "path-to-regexp";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
};

enum Method {
  get = "get",
  post = "post",
}

type Pathname = string | RegExp;

export type RouteHandler<T = any> = (req: Request<T>, res: Response) => void;
type Request<T = any> = IncomingMessage & { params: T };
type Response = {
  send(str: string, statusCode?: number, mimeType?: string): void;
  json(obj: object, statusCode?: number): void;
};

type Route = {
  method: Method;
  pathname: Pathname;
  match: MatchFunction;
  cb: RouteHandler;
};

class Router {
  private routes: Route[] = [];

  private addRoute(method: Method, pathname: Pathname, cb: RouteHandler) {
    this.routes.push({
      pathname,
      match: match(pathname),
      method,
      cb,
    });

    return this;
  }

  private getResponse(res: ServerResponse): Response {
    return {
      json: (json, statusCode = 200) => {
        res.writeHead(statusCode, {
          ...headers,
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(json));
      },

      send: (str, statusCode = 200, mimeType = "text/plain") => {
        res.writeHead(statusCode, {
          ...headers,
          "Content-Type": mimeType,
        });
        res.end(str);
      },
    };
  }

  private getRequest(_req: IncomingMessage, params: any = {}) {
    const req = _req as Request;
    req.params = params;

    return req;
  }

  public async run(_req: IncomingMessage, _res: ServerResponse) {
    const res = this.getResponse(_res);

    const { pathname: currentPathname } = URL.parse(_req.url || "", true);
    const currentMethod = _req.method?.toLowerCase() || "";

    if (currentPathname && currentMethod) {
      const handler = this.routes.find(
        (route) =>
          route.method === currentMethod && route.match(currentPathname)
      );

      if (handler) {
        // Serve route handler
        const parsedPathname = handler.match(currentPathname);
        const req = this.getRequest(
          _req,
          parsedPathname && parsedPathname?.params
        );

        return handler.cb(req, res);
      } else {
        // Or server static files
        const fileUri =
          currentPathname === "/" ? "/index.html" : currentPathname;
        try {
          const data = await fs.promises.readFile(
            path.resolve(__dirname, `../public${fileUri}`)
          );

          if (data) {
            _res.writeHead(200);
            return _res.end(data);
          }
        } catch (e) {}
      }
    }

    res.json({ error: "Not Found" }, 404);
  }

  public get(pathname: Pathname, cb: RouteHandler) {
    return this.addRoute(Method.get, pathname, cb);
  }

  public post(pathname: Pathname, cb: RouteHandler) {
    return this.addRoute(Method.post, pathname, cb);
  }
}

export default Router;
