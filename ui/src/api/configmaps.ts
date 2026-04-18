import { apiClient } from "./client";
import type {
  ConfigMap,
  ConfigMapList,
  CreateConfigMapRequest,
  MutationResponse,
} from "@src/types";

export const listConfigMaps = (namespace: string) =>
  apiClient.get<ConfigMapList>(`/config-map/${namespace}`).then((r) => r.data);

export const getConfigMap = (namespace: string, name: string) =>
  apiClient
    .get<ConfigMap>(`/config-map/${namespace}/${name}`)
    .then((r) => r.data);

export const createConfigMap = (payload: CreateConfigMapRequest) =>
  apiClient.post<MutationResponse>(`/config-map/`, payload).then((r) => r.data);

export const updateConfigMap = (
  namespace: string,
  name: string,
  payload: CreateConfigMapRequest,
) =>
  apiClient
    .put<MutationResponse>(`/config-map/${namespace}/${name}`, payload)
    .then((r) => r.data);

export const deleteConfigMap = (namespace: string, name: string) =>
  apiClient
    .delete<MutationResponse>(`/config-map/${namespace}/${name}`)
    .then((r) => r.data);
