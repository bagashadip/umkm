/**
 * Serverless entry for the NestJS API on Vercel.
 *
 * Plain CommonJS, no build step: Vercel compiles a .ts entry with esbuild,
 * which cannot emit the `design:paramtypes` metadata that NestJS dependency
 * injection reads. Nothing here needs compiling — the application itself was
 * built by `tsc` (`nest build`), where that metadata lives in `dist/` as
 * ordinary runtime expressions.
 *
 * `main.ts` stays as the `npm run start` entry for local development.
 */
require("reflect-metadata");

const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/src/app.module");

/**
 * Routes are registered without the `/api` prefix here (main.ts keeps it for
 * local development), and the prefix is stripped from the incoming URL below.
 *
 * `vercel.json` rewrites `/api/<route>` to `/api/index?path=<route>` because
 * the NestJS preset's own rule otherwise returns 404 for every `/api/*` path
 * before this handler ever runs — the original path arrives in that query
 * param instead. Fall back to stripping the prefix so a direct hit lands on
 * the same route.
 */
function normalizedUrl(url) {
  if (typeof url !== "string") return "/";
  const queryIndex = url.indexOf("?");
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex === -1 ? "" : url.slice(queryIndex + 1));

  const rewrittenPath = params.get("path");
  if (rewrittenPath !== null) {
    params.delete("path");
    const rest = params.toString();
    const target = "/" + rewrittenPath.replace(/^\/+/, "");
    return rest ? `${target}?${rest}` : target;
  }

  const target = pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  const rest = params.toString();
  return rest ? `${target}?${rest}` : target;
}

const corsOrigins = () =>
  (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3113")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

/** @type {Promise<import("@nestjs/common").INestApplication> | undefined} */
let appPromise;

function respond(res, status, body, origin) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  res.end(body);
}

function nestApp() {
  if (!appPromise) {
    appPromise = NestFactory.create(AppModule, { logger: ["error", "warn"] })
      .then((app) => {
        // CORS is express middleware, so it applies whether or not a server
        // is listening.
        app.enableCors({ origin: corsOrigins(), credentials: false });
        return app.init().then(() => app);
      })
      .catch((error) => {
        // A failed boot must not be cached for the life of the process.
        appPromise = undefined;
        throw error;
      });
  }
  return appPromise;
}

async function handler(req, res) {
  const origin = req.headers.origin;

  // Vercel can answer an unhandled preflight before the runtime sees it, so the
  // browser has nothing to read the CORS policy from. Answer OPTIONS here.
  if (req.method === "OPTIONS") {
    respond(res, 204, "", corsOrigins().includes(origin ?? "") ? origin : undefined);
    return;
  }

  try {
    const app = await nestApp();
    // Express reads the path from req.url, so normalize it before handing the
    // request over; the route table above was built without a prefix.
    req.url = normalizedUrl(req.url);
    // NestApplication owns an http.Server over its express instance; emit()
    // forwards into that instance without ever listening on a port.
    const server = app.getHttpServer();
    if (!server.emit("request", req, res)) {
      respond(res, 500, JSON.stringify({ statusCode: 500, message: "Service unavailable" }));
    }
  } catch (error) {
    // Never leak a stack trace or a connection string to the client.
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status = /P1001|Can't reach database|ECONNREFUSED/i.test(detail) ? 503 : 500;
    respond(res, status, JSON.stringify({ statusCode: status, message: "Service unavailable" }));
  }
}

// The function timeout lives in vercel.json ("functions.maxDuration"): that is
// the documented place for it, rather than an export shape Node must pick up.

module.exports = handler;
