import "./loadEnv.ts";

function getTrimmedEnv(key: string) {
  return process.env[key]?.trim() || "";
}

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getJwtSecret() {
  return getTrimmedEnv("JWT_SECRET") || "vrms-pro-development-secret";
}

export function getAdminCredentials() {
  const username = getTrimmedEnv("ADMIN_USERNAME");
  const password = getTrimmedEnv("ADMIN_PASSWORD");

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function getFrontendUrl() {
  return normalizeUrl(getTrimmedEnv("FRONTEND_URL") || "http://localhost:5173");
}

export function getMailConfig() {
  const host = getTrimmedEnv("SMTP_HOST");
  const port = Number(getTrimmedEnv("SMTP_PORT") || 0);
  const user = getTrimmedEnv("SMTP_USER");
  const pass = getTrimmedEnv("SMTP_PASS");
  const from = getTrimmedEnv("MAIL_FROM");
  const secure = getTrimmedEnv("SMTP_SECURE") === "true";
  const emailUser = getTrimmedEnv("EMAIL_USER");
  const emailPass = getTrimmedEnv("EMAIL_PASS");

  if (!host || !port || !user || !pass || !from) {
    if (!emailUser || !emailPass) {
      return null;
    }

    return {
      host: "smtp.gmail.com",
      port: 465,
      user: emailUser,
      pass: emailPass,
      from: from || emailUser,
      secure: true,
    };
  }

  return { host, port, user, pass, from, secure };
}

export function getAllowedCorsOrigins() {
  const configuredOrigins = [getTrimmedEnv("FRONTEND_URL"), getTrimmedEnv("FRONTEND_URLS")]
    .flatMap((value) => value.split(","))
    .map((origin) => normalizeUrl(origin.trim()))
    .filter(Boolean);

  return Array.from(
    new Set([
      "http://localhost:5000",
      "http://localhost:5001",
      "http://localhost:5173",
      "http://localhost:3000",
      ...configuredOrigins,
    ]),
  );
}
