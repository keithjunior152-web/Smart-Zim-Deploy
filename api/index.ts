/// <reference path="./global.d.ts" />

type RequestHandler = (req: unknown, res: unknown) => void;

let appPromise: Promise<RequestHandler> | null = null;

async function getApp(): Promise<RequestHandler> {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/dist/app.mjs").then(
      (mod) => (mod as { default: RequestHandler }).default,
    );
  }
  return appPromise;
}

export default async function handler(req: unknown, res: unknown) {
  const app = await getApp();
  app(req, res);
}
