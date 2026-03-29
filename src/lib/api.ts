const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

export const API_BASE_URL = getApiBaseUrl();
