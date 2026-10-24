import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, setupVite, log } from "./vite";
import { createServer, type Server } from "http";

export function createExpressApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.set("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (!req.path.startsWith("/api")) return;
      const duration = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    });
    next();
  });

  return app;
}

export async function attachClient(app: Express, server: Server): Promise<void> {
  if (app.get("env") === "development") {
    await setupVite(app, server);
    return;
  }
  if (process.env.NODE_ENV === "test") return;
  serveStatic(app);
}

export function attachErrorHandler(app: Express): void {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const syntax = err instanceof SyntaxError && "body" in (err as { body?: unknown });
    if (syntax) {
      res.status(400).json({
        success: false,
        message: "Request body must be JSON.",
      });
      return;
    }
    console.error("Unhandled request error.", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  });
}

export async function createApp(): Promise<{ app: Express; server: Server }> {
  const app = createExpressApp();
  registerRoutes(app);
  attachErrorHandler(app);
  const server = createServer(app);
  await attachClient(app, server);
  return { app, server };
}
