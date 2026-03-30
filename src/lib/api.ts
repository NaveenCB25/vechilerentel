const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const LOCAL_DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:5001",
  "http://127.0.0.1:5173",
]);

function getBrowserApiBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const currentOrigin = normalizeBaseUrl(window.location.origin);
  if (!LOCAL_DEV_ORIGINS.has(currentOrigin)) {
    return currentOrigin;
  }

  if (currentOrigin.endsWith(":3000") || currentOrigin.endsWith(":5173")) {
    return "http://localhost:5001";
  }

  return currentOrigin;
}

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  }

  if (typeof window !== "undefined") {
    return getBrowserApiBaseUrl();
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5001";
  }

  return "";
};

export const API_BASE_URL = getApiBaseUrl();
