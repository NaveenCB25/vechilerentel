import dotenv from "dotenv";

dotenv.config({ quiet: true });

function getTrimmedEnv(key: string) {
  return process.env[key]?.trim() || "";
}

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getJwtSecret() {
  return getTrimmedEnv("JWT_SECRET") || "vrms-pro-development-secret";
}

export function getFrontendUrl() {
  return normalizeUrl(getTrimmedEnv("FRONTEND_URL") || "http://localhost:5173");
}

export function getAllowedCorsOrigins() {
  const configuredOrigins = [getTrimmedEnv("FRONTEND_URL"), getTrimmedEnv("FRONTEND_URLS")]
    .flatMap((value) => value.split(","))
    .map((origin) => normalizeUrl(origin.trim()))
    .filter(Boolean);

  return Array.from(
    new Set([
      "http://localhost:5000",
      "http://localhost:5173",
      "http://localhost:3000",
      ...configuredOrigins,
    ]),
  );
}
