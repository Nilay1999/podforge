import { apiClient } from "./client";
import type { NamespaceList, CreateNamespaceRequest, MutationResponse } from "@src/types";

export const listNamespaces = () =>
  apiClient.get<NamespaceList>("/namespaces/").then((r) => r.data);

export const createNamespace = (payload: CreateNamespaceRequest) =>
  apiClient.post<MutationResponse>("/namespaces/", payload).then((r) => r.data);

export const deleteNamespace = (name: string) =>
  apiClient.delete<MutationResponse>(`/namespaces/${name}`).then((r) => r.data);
