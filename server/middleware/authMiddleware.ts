import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getJwtSecret } from "../lib/runtimeConfig.ts";

const JWT_SECRET = getJwtSecret();

type AuthRole = "user" | "admin";
export type AuthTokenPayload = {
  role: AuthRole;
  userId?: string;
  email?: string;
  username?: string;
};

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function requireAuth(role: AuthRole) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return response.status(401).json({ success: false, error: "Authentication required" });
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();

    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

      if (payload.role !== role) {
        return response.status(403).json({ success: false, error: "You do not have access to this resource" });
      }

      request.auth = payload;
      next();
    } catch (error) {
      return response.status(401).json({ success: false, error: "Your session has expired. Please sign in again." });
    }
  };
}
