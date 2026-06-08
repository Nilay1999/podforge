import { apiClient } from "./client";
import type { Secret, SecretList, CreateSecretRequest, MutationResponse } from "@src/types";

export const listSecrets = (namespace: string) =>
  apiClient.get<SecretList>(`/secret/${namespace}`).then((r) => r.data);

export const getSecret = (namespace: string, name: string) =>
  apiClient.get<Secret>(`/secret/${namespace}/${name}`).then((r) => r.data);

export const createSecret = (payload: CreateSecretRequest) =>
  apiClient.post<MutationResponse>("/secret/", payload).then((r) => r.data);

export const updateSecret = (namespace: string, name: string, payload: CreateSecretRequest) =>
  apiClient.put<MutationResponse>(`/secret/${namespace}/${name}`, payload).then((r) => r.data);

export const deleteSecret = (namespace: string, name: string) =>
  apiClient.delete<MutationResponse>(`/secret/${namespace}/${name}`).then((r) => r.data);
