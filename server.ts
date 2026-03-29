import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fs from "node:fs";

import authRoutes from "./server/routes/authRoutes.ts";
import { getAllowedCorsOrigins } from "./server/lib/runtimeConfig.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ quiet: true });

const serverEnvPath = path.resolve(__dirname, "server", ".env");
if (fs.existsSync(serverEnvPath)) {
  // Optional server-only env file. Do not override the root `.env` by default.
  dotenv.config({ path: serverEnvPath, override: false, quiet: true });
}

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MONGODB_URI = process.env.MONGODB_URI || "";

const app = express();

app.use(cors({
  origin: getAllowedCorsOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

console.log(`[vrms-pro] NODE_ENV=${process.env.NODE_ENV || "development"} PORT=${PORT}`);

app.use("/api/auth", authRoutes);
app.get("/api/health", (_req, res) => res.json({ success: true, service: "vrms-pro" }));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

void startServer();

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
    });
} else {
  console.warn("MONGODB_URI is not set. Auth endpoints that require the database may fail.");
}

async function startServer() {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[vrms-pro] Vite middleware enabled (dev).");

    // In middleware mode, Vite does not automatically serve index.html.
    // Serve the SPA entry for all non-API routes.
    app.use(async (request, response, next) => {
      if (request.originalUrl.startsWith("/api")) {
        next();
        return;
      }

      try {
        const url = request.originalUrl;
        const indexPath = path.resolve(__dirname, "index.html");
        const template = await vite.transformIndexHtml(url, fs.readFileSync(indexPath, "utf-8"));
        response.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get(/^(?!\/api).*/, (_request, response) => {
      response.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[vrms-pro] UI: http://localhost:${PORT}`);
    console.log(`[vrms-pro] Health: http://localhost:${PORT}/api/health`);
  });
}
