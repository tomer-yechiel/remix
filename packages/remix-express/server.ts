import type * as express from "express";
import type {
  AppLoadContext,
  ServerBuild,
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
} from "@remix-run/node";
import {
  AbortController as NodeAbortController,
  createRequestHandler as createRemixRequestHandler,
  Headers as NodeHeaders,
  Request as NodeRequest,
  writeReadableStreamToWritable,
} from "@remix-run/node";

import { AsyncLocalStorage } from 'node:async_hooks';


/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action, such as
 * values that are generated by Express middleware like `req.session`.
 */
export type GetLoadContextFunction = (
  req: express.Request,
  res: express.Response
) => AppLoadContext;

export type GetGlobalContextFunction<T> = (
  request: NodeRequest
) => T;

export type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;


let asyncLocalStorage: AsyncLocalStorage<unknown>;

export function getGlobalContext<T>(): T | undefined {
  return asyncLocalStorage.getStore<T>();
}

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler<T>({
  build,
  getLoadContext,
  getGlobalContext,
  mode = process.env.NODE_ENV,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction;
  getGlobalContext?: GetGlobalContextFunction<T>;
  mode?: string;
}): RequestHandler {
  let handleRequest = createRemixRequestHandler(build, mode);

  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let request = createRemixRequest(req, res);
      let loadContext = getLoadContext?.(req, res);
      let context = getGlobalContext?.(request);
      let response = asyncLocalStorage.run(context, async () => {
        return (await handleRequest(
          request,
          loadContext
        )) as NodeResponse;
      });

      await sendRemixResponse(res, response);
    } catch (error: unknown) {
      // Express doesn't support async functions, so we have to pass along the
      // error manually using next().
      next(error);
    }
  };
}

export function createRemixHeaders(
  requestHeaders: express.Request["headers"]
): NodeHeaders {
  let headers = new NodeHeaders();

  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export function createRemixRequest(
  req: express.Request,
  res: express.Response
): NodeRequest {
  let origin = `${req.protocol}://${req.get("host")}`;
  let url = new URL(req.url, origin);

  // Abort action/loaders once we can no longer write a response
  let controller = new NodeAbortController();
  res.on("close", () => controller.abort());

  let init: NodeRequestInit = {
    method: req.method,
    headers: createRemixHeaders(req.headers),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as NodeRequestInit["signal"],
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
  }

  return new NodeRequest(url.href, init);
}

export async function sendRemixResponse(
  res: express.Response,
  nodeResponse: NodeResponse
): Promise<void> {
  res.statusMessage = nodeResponse.statusText;
  res.status(nodeResponse.status);

  for (let [key, values] of Object.entries(nodeResponse.headers.raw())) {
    for (let value of values) {
      res.append(key, value);
    }
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
