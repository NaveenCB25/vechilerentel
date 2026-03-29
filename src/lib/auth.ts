export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user";
};

export const AUTH_CHANGE_EVENT = "authchange";

const USER_TOKEN_KEY = "token";
const USER_KEY = "user";
const ADMIN_TOKEN_KEY = "adminToken";

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function notifyAuthChange() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function readStorage(key: string) {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorage(key: string) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function getUserToken() {
  return readStorage(USER_TOKEN_KEY);
}

export function getAdminToken() {
  return readStorage(ADMIN_TOKEN_KEY);
}

export function getStoredUser() {
  const storedUser = readStorage(USER_KEY);

  if (!storedUser || storedUser === "undefined") {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as Partial<SessionUser>;

    if (typeof parsedUser.name !== "string" || typeof parsedUser.email !== "string") {
      removeStorage(USER_KEY);
      return null;
    }

    return {
      id: typeof parsedUser.id === "string" ? parsedUser.id : "",
      name: parsedUser.name,
      email: parsedUser.email,
      role: "user",
    };
  } catch {
    removeStorage(USER_KEY);
    return null;
  }
}

export function setUserSession(token: string, user: SessionUser) {
  writeStorage(USER_TOKEN_KEY, token);
  writeStorage(USER_KEY, JSON.stringify({ ...user, role: "user" }));
  notifyAuthChange();
}

export function updateStoredUser(user: SessionUser) {
  writeStorage(USER_KEY, JSON.stringify({ ...user, role: "user" }));
  notifyAuthChange();
}

export function clearUserSession() {
  removeStorage(USER_TOKEN_KEY);
  removeStorage(USER_KEY);
  notifyAuthChange();
}

export function setAdminSession(token: string) {
  writeStorage(ADMIN_TOKEN_KEY, token);
  notifyAuthChange();
}

export function clearAdminSession() {
  removeStorage(ADMIN_TOKEN_KEY);
  notifyAuthChange();
}

export function createAuthHeaders(token: string | null): HeadersInit {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
