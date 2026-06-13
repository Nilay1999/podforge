import { apiClient } from "./client";
import type { CreateUserRequest, UpdateUserRequest, UserAccount } from "@src/types";

export const listUsers = () =>
  apiClient.get<UserAccount[]>("/auth/users/").then((r) => r.data);

export const createUser = (payload: CreateUserRequest) =>
  apiClient.post("/auth/users/", payload).then((r) => r.data);

export const updateUser = (username: string, payload: UpdateUserRequest) =>
  apiClient.put(`/auth/users/${username}`, payload).then((r) => r.data);

export const deleteUser = (username: string) =>
  apiClient.delete(`/auth/users/${username}`).then((r) => r.data);
