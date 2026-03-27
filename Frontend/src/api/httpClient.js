import axios from "axios";
import { attachAuthInterceptors, AUTH_BASE_URL } from "./authSession";

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
];

export const httpClient = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true,
});

attachAuthInterceptors(httpClient, { publicPaths: PUBLIC_AUTH_PATHS });
