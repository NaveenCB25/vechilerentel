import express from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import mongoose from "mongoose";

import "./server/lib/loadEnv.ts";
import authRoutes from "./server/routes/authRoutes.ts";
import locationRoutes from "./server/routes/locationRoutes.ts";
import rentalRoutes from "./server/routes/rentalRoutes.ts";
import { getAdminCredentials, getAllowedCorsOrigins } from "./server/lib/runtimeConfig.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_STARTED_AT = Date.now();

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MONGODB_URI = process.env.MONGODB_URI || "";
const ENABLE_IN_MEMORY_FALLBACK = process.env.IN_MEMORY_FALLBACK !== "false";
const BODY_LIMIT = process.env.API_BODY_LIMIT || "1mb";
const allowedCorsOrigins = new Set(getAllowedCorsOrigins());

let mongoConnected = mongoose.connection.readyState === 1;

const app = express();

app.disable("x-powered-by");

if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

function isApiRequest(requestPath: string) {
  return requestPath === "/api" || requestPath.startsWith("/api/");
}

function getRequestId(request: express.Request) {
  const requestIdHeader = request.headers["x-request-id"];

  if (typeof requestIdHeader === "string" && requestIdHeader.trim()) {
    return requestIdHeader.trim();
  }

  return randomUUID();
}

function buildHealthPayload() {
  const fallbackActive = !mongoConnected && ENABLE_IN_MEMORY_FALLBACK;

  return {
    success: true,
    service: "vrms-pro",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    startedAt: new Date(SERVER_STARTED_AT).toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      connected: mongoConnected,
      provider: mongoConnected ? "mongodb" : "memory",
    },
    fallback: {
      enabled: ENABLE_IN_MEMORY_FALLBACK,
      active: fallbackActive,
    },
  };
}

function createCorsOptions(): cors.CorsOptions {
  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (allowedCorsOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${normalizedOrigin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  };
}

function registerMongoListeners() {
  mongoose.connection.on("connected", () => {
    mongoConnected = true;
  });

  mongoose.connection.on("disconnected", () => {
    mongoConnected = false;
  });

  mongoose.connection.on("error", (error) => {
    mongoConnected = false;
    console.error("[vrms-pro] MongoDB runtime error:", error);
  });
}

function setupMiddleware() {
  app.use((request, response, next) => {
    const requestId = getRequestId(request);
    const startedAt = Date.now();

    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    response.setHeader("x-content-type-options", "nosniff");
    response.setHeader("x-frame-options", "DENY");
    response.setHeader("referrer-policy", "strict-origin-when-cross-origin");
    response.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
    response.setHeader("cross-origin-resource-policy", "same-site");

    response.on("finish", () => {
      if (!isApiRequest(request.path)) {
        return;
      }

      const durationMs = Date.now() - startedAt;
      console.log(
        `[vrms-pro] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms id=${requestId}`,
      );
    });

    next();
  });

  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

  console.log(`[vrms-pro] NODE_ENV=${process.env.NODE_ENV || "development"} PORT=${PORT}`);
  console.log(`[vrms-pro] CORS origins: ${Array.from(allowedCorsOrigins).join(", ")}`);
}

function setupApiRoutes() {
  app.get("/api/health", (_request, response) => {
    response.json(buildHealthPayload());
  });

  app.use((request, response, next) => {
    if (!isApiRequest(request.path)) {
      next();
      return;
    }

    if (!mongoConnected && !ENABLE_IN_MEMORY_FALLBACK) {
      return response.status(503).json({
        success: false,
        error: "MongoDB is not connected",
        requestId: response.locals.requestId,
      });
    }

    if (!mongoConnected && ENABLE_IN_MEMORY_FALLBACK) {
      response.setHeader("x-mongo-fallback", "true");
    }

    next();
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/rentals", rentalRoutes);

  app.use((request, response, next) => {
    if (!isApiRequest(request.path)) {
      next();
      return;
    }

    response.status(404).json({
      success: false,
      error: "API route not found",
      requestId: response.locals.requestId,
    });
  });
}

async function connectToMongo() {
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Auth endpoints that require the database may fail.");
    mongoConnected = false;
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    mongoConnected = true;
    console.log("[vrms-pro] Connected to MongoDB");
  } catch (error) {
    console.error("[vrms-pro] MongoDB connection error:", error);
    mongoConnected = false;

    if (IS_PRODUCTION) {
      console.error("[vrms-pro] Failed to connect to MongoDB in production; exiting.");
      process.exit(1);
    }

    if (ENABLE_IN_MEMORY_FALLBACK) {
      console.warn("[vrms-pro] MongoDB unavailable; running in in-memory fallback mode for development.");
    } else {
      console.warn("[vrms-pro] Starting with MongoDB disconnected. Please fix environment and restart.");
    }
  }
}

async function setupFrontend() {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Local-only dev mode: disable the separate HMR websocket port so it
        // doesn't keep colliding with stale listeners between restarts.
        hmr: false,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
    console.log("[vrms-pro] Vite middleware enabled (dev, HMR disabled for localhost stability).");

    app.use(async (request, response, next) => {
      if (isApiRequest(request.originalUrl)) {
        next();
        return;
      }

      try {
        const indexPath = path.resolve(__dirname, "index.html");
        const template = await vite.transformIndexHtml(
          request.originalUrl,
          fs.readFileSync(indexPath, "utf-8"),
        );

        response.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });

    return;
  }

  app.use(express.static(path.resolve(__dirname, "dist")));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

function setupErrorHandler() {
  app.use(
    (
      error: Error & { statusCode?: number },
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      const requestId = String(response.locals.requestId || "");
      const isCorsError = error.message.includes("not allowed by CORS");
      const statusCode = isCorsError ? 403 : error.statusCode || 500;
      const errorMessage = statusCode >= 500 ? "Internal Server Error" : error.message;

      console.error(`[vrms-pro] request failed id=${requestId}`, error);
      response.status(statusCode).json({ success: false, error: errorMessage, requestId });
    },
  );
}

function listenWithDevFallback(preferredPort: number) {
  const maxAttempts = IS_PRODUCTION ? 1 : 10;

  return new Promise<{ server: Server; port: number }>((resolve, reject) => {
    const attemptListen = (port: number, attemptsRemaining: number) => {
      const server = app.listen(port, "0.0.0.0");

      server.once("listening", () => {
        resolve({ server, port });
      });

      server.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE" && attemptsRemaining > 1) {
          console.warn(`[vrms-pro] Port ${port} is busy. Trying localhost port ${port + 1}...`);
          attemptListen(port + 1, attemptsRemaining - 1);
          return;
        }

        reject(error);
      });
    };

    attemptListen(preferredPort, maxAttempts);
  });
}

function registerProcessHandlers(server: Server) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`[vrms-pro] Received ${signal}. Shutting down gracefully...`);

    server.close(async (serverError) => {
      if (serverError) {
        console.error("[vrms-pro] HTTP server shutdown error:", serverError);
        process.exit(1);
        return;
      }

      try {
        await mongoose.connection.close();
      } catch (mongoError) {
        console.error("[vrms-pro] MongoDB shutdown error:", mongoError);
        process.exit(1);
        return;
      }

      console.log("[vrms-pro] Shutdown complete.");
      process.exit(0);
    });
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

registerMongoListeners();
setupMiddleware();
setupApiRoutes();

async function startServer() {
  if (!getAdminCredentials()) {
    const message = "[vrms-pro] ADMIN_USERNAME and ADMIN_PASSWORD must be set for admin login.";

    if (IS_PRODUCTION) {
      console.error(`${message} Refusing to start in production.`);
      process.exit(1);
    }

    console.warn(message);
  }

  await connectToMongo();
  await setupFrontend();
  setupErrorHandler();

  try {
    const { server, port } = await listenWithDevFallback(PORT);

    console.log(`[vrms-pro] UI: http://localhost:${port}`);
    console.log(`[vrms-pro] Health: http://localhost:${port}/api/health`);

    registerProcessHandlers(server);
    return;
  } catch (error) {
    const serverError = error as NodeJS.ErrnoException;

    if (serverError.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use and no nearby localhost port was available.`);
      process.exit(1);
    }

    console.error("[vrms-pro] Server error:", serverError);
    process.exit(1);
  }
}

void startServer();
