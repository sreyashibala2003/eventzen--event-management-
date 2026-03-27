import axios from "axios";
import { expireSession, getToken, isTokenExpired, setToken } from "../auth/tokenStore";

export const AUTH_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

const refreshClient = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true,
});

let refreshingPromise = null;

export async function requestAccessTokenRefresh() {
  if (!refreshingPromise) {
    refreshingPromise = refreshClient
      .post("/auth/refresh")
      .then((response) => {
        const nextToken = response.data?.accessToken;
        if (!nextToken) {
          throw new Error("Refresh response did not include an access token.");
        }
        setToken(nextToken);
        return nextToken;
      })
      .catch((error) => {
        expireSession("refresh_failed");
        throw error;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }

  return refreshingPromise;
}

export function attachAuthInterceptors(client, options = {}) {
  const { publicPaths = [], refreshPath = "/auth/refresh" } = options;

  const isPublicRequest = (url = "") => publicPaths.some((path) => url.includes(path));

  client.interceptors.request.use(async (config) => {
    if (isPublicRequest(config.url)) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    let token = getToken();
    if (token && isTokenExpired(token)) {
      token = await requestAccessTokenRefresh();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (!original) {
        return Promise.reject(error);
      }

      if (
        error.response?.status === 401 &&
        !isPublicRequest(original.url) &&
        !original.__isRetryRequest &&
        !original.url?.includes(refreshPath)
      ) {
        original.__isRetryRequest = true;

        try {
          const nextToken = await requestAccessTokenRefresh();
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${nextToken}`;
          return client(original);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );
}
