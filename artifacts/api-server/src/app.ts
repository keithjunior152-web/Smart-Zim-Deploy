import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Build the allowed-origins list from env vars.
// ALLOWED_ORIGINS   — explicit comma-separated list (production / CI)
// REPLIT_DOMAINS    — Replit-injected preview domains (dev on Replit)
// REPLIT_DEV_DOMAIN — Replit dev tunnel domain
// Fallback          — localhost ports used by Vite dev servers
const _explicit = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const _replitDomains = [
  ...(process.env.REPLIT_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `https://${d}`),
  ...(process.env.REPLIT_DEV_DOMAIN
    ? [`https://${process.env.REPLIT_DEV_DOMAIN}`]
    : []),
];

const _devFallback =
  _explicit.length === 0 && _replitDomains.length === 0
    ? ["http://localhost:3000", "http://localhost:4173", "http://localhost:22156"]
    : [];

const allowedOrigins = [...new Set([..._explicit, ..._replitDomains, ..._devFallback])];

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = same-origin or server-to-server, always allow
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In dev, also allow any *.replit.dev or *.repl.co subdomain
      if (
        process.env.NODE_ENV !== "production" &&
        (/\.replit\.dev$/.test(origin) || /\.repl\.co$/.test(origin) || /\.worf\.replit\.dev$/.test(origin))
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const PgSessionStore = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set. Generate a random secret and add it to your environment variables.");
}

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    store: new PgSessionStore({
      conObject: { connectionString: process.env.DATABASE_URL },
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

app.use("/api", router);

export default app;
