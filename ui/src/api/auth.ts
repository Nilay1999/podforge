import { apiClient } from "./client";
import type { AuthProviders, Identity, LoginResponse } from "@src/types";

export const login = (username: string, password: string) =>
  apiClient.post<LoginResponse>("/auth/login", { username, password }).then((r) => r.data);

export const fetchMe = () => apiClient.get<Identity>("/auth/me").then((r) => r.data);

export const fetchProviders = () =>
  apiClient.get<AuthProviders>("/auth/providers").then((r) => r.data);
