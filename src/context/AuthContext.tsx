import React, { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AUTH_CHANGE_EVENT,
  clearAdminSession,
  clearUserSession,
  getAdminToken,
  getStoredUser,
  getUserToken,
  setAdminSession,
  setUserSession,
  type SessionUser,
  updateStoredUser,
} from "../lib/auth";

export interface User extends SessionUser {
  role: "user";
}

interface AuthContextType {
  user: User | null;
  userToken: string | null;
  adminToken: string | null;
  token: string | null;
  isLoading: boolean;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loginUser: (token: string, userData: User) => void;
  logoutUser: () => void;
  loginAdmin: (token: string) => void;
  logoutAdmin: () => void;
  updateUser: (userData: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userToken: null,
  adminToken: null,
  token: null,
  isLoading: true,
  isUserAuthenticated: false,
  isAdminAuthenticated: false,
  login: () => {},
  logout: () => {},
  loginUser: () => {},
  logoutUser: () => {},
  loginAdmin: () => {},
  logoutAdmin: () => {},
  updateUser: () => {},
});

function readAuthState() {
  return {
    user: getStoredUser(),
    userToken: getUserToken(),
    adminToken: getAdminToken(),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncAuthState = () => {
      const nextState = readAuthState();
      setUser(nextState.user);
      setUserToken(nextState.userToken);
      setAdminToken(nextState.adminToken);
      setIsLoading(false);
    };

    syncAuthState();
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuthState);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuthState);
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    userToken,
    adminToken,
    token: userToken,
    isLoading,
    isUserAuthenticated: Boolean(userToken && user),
    isAdminAuthenticated: Boolean(adminToken),
    login: (token, userData) => {
      setUserSession(token, { ...userData, role: "user" });
    },
    logout: () => {
      clearUserSession();
    },
    loginUser: (token, userData) => {
      setUserSession(token, { ...userData, role: "user" });
    },
    logoutUser: () => {
      clearUserSession();
    },
    loginAdmin: (token) => {
      setAdminSession(token);
    },
    logoutAdmin: () => {
      clearAdminSession();
    },
    updateUser: (userData) => {
      updateStoredUser({ ...userData, role: "user" });
    },
  }), [adminToken, isLoading, user, userToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
