/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { httpClient } from "../api/httpClient";
import { requestAccessTokenRefresh } from "../api/authSession";
import {
  clearToken,
  getAuthExpiredEventName,
  getToken,
  isTokenExpired,
  setToken,
} from "./tokenStore";

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (!role) return null;
  return String(role).trim().toUpperCase();
}

function decodeBase64Url(value) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserFromToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payload = decodeBase64Url(parts[1]);
  if (!payload) return null;

  const roles = Array.isArray(payload.roles)
    ? payload.roles
    : payload.role
      ? [payload.role]
      : [];

  return {
    userId: payload.sub || payload.userId || payload.user_id,
    email: payload.email || "",
    role: payload.role || roles[0] || null,
    roles,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    iat: payload.iat,
    exp: payload.exp,
  };
}

function mergeUserWithTokenClaims(user, token) {
  const tokenUser = getUserFromToken(token);
  if (!tokenUser) {
    return user ?? null;
  }

  return {
    ...user,
    ...tokenUser,
    roles:
      Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : tokenUser.roles,
    role: user?.role ?? tokenUser.role,
    permissions:
      Array.isArray(user?.permissions) && user.permissions.length > 0
        ? user.permissions
        : tokenUser.permissions,
    email: user?.email ?? tokenUser.email,
    userId: user?.userId ?? tokenUser.userId,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      let existingToken = getToken();
      if (!existingToken) {
        setLoading(false);
        return;
      }

      if (isTokenExpired(existingToken)) {
        try {
          existingToken = await requestAccessTokenRefresh();
        } catch {
          setUser(null);
          setLoading(false);
          return;
        }
      }

      // Restore auth state from JWT first so a page refresh does not force logout.
      const tokenUser = mergeUserWithTokenClaims(null, existingToken);
      if (tokenUser) {
        setUser(tokenUser);
        setLoading(false);
      }

      try {
        const res = await httpClient.get("/auth/me");
        setUser(mergeUserWithTokenClaims(res.data, getToken() ?? existingToken));
      } catch {
        // Keep token-derived user when auth service is temporarily unavailable.
        if (!tokenUser) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearToken();
      setUser(null);
      setLoading(false);
    };

    const eventName = getAuthExpiredEventName();
    window.addEventListener(eventName, handleAuthExpired);

    return () => {
      window.removeEventListener(eventName, handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    if (!user?.exp) return undefined;

    const expiresAt = user.exp * 1000;
    const remainingMs = expiresAt - Date.now();

    if (remainingMs <= 0) {
      void requestAccessTokenRefresh()
        .then((nextToken) => {
          setUser((currentUser) => mergeUserWithTokenClaims(currentUser, nextToken));
        })
        .catch(() => {
          setUser(null);
        });
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void requestAccessTokenRefresh()
        .then((nextToken) => {
          setUser((currentUser) => mergeUserWithTokenClaims(currentUser, nextToken));
        })
        .catch(() => {
          setUser(null);
        });
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const value = useMemo(() => {
    const rawRoles = Array.isArray(user?.roles)
      ? user.roles
      : user?.roles
        ? Array.from(user.roles)
        : user?.role
          ? [user.role]
          : [];

    const roles = rawRoles.map(normalizeRole).filter(Boolean);

    const hasRole = (role) => {
      const normalized = normalizeRole(role);
      if (!normalized) return false;
      return (
        roles.includes(normalized) ||
        roles.includes(`ROLE_${normalized}`) ||
        roles.includes(normalized.replace(/^ROLE_/, ""))
      );
    };

    const hasAnyRole = (candidateRoles = []) =>
      candidateRoles.some((role) => hasRole(role));

    const isAdmin = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);

    return {
      user,
      loading,
      roles,
      isAdmin,
      hasRole,
      hasAnyRole,
      isAuthenticated: Boolean(user),
      async login(payload) {
        // Ensure a stale token never interferes with a fresh login attempt.
        clearToken();
        const res = await httpClient.post("/auth/login", payload);
        setToken(res.data.accessToken);
        setUser(mergeUserWithTokenClaims(res.data.user, res.data.accessToken));
        return res.data;
      },
      async register(payload) {
        await httpClient.post("/auth/register", payload);
      },
      async logout() {
        clearToken();
        setUser(null);
        try {
          await httpClient.post("/auth/logout");
        } catch {
          // Local logout should still succeed even if the backend logout request fails.
        }
      },
      async refreshUser() {
        const res = await httpClient.get("/auth/me");
        setUser(mergeUserWithTokenClaims(res.data, getToken()));
        return res.data;
      },
    };
  }, [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
