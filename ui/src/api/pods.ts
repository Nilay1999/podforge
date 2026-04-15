import { apiClient } from "./client";
import type {
  CreatePodRequest,
  MutationResponse,
  Pod,
  PodList,
} from "../types";

export const listPods = (namespace: string) =>
  apiClient.get<PodList>(`/pod/${namespace}`).then((r) => r.data);

export const getPod = (namespace: string, name: string) =>
  apiClient.get<Pod>(`/pod/${namespace}/${name}`).then((r) => r.data);

export const createPod = (payload: CreatePodRequest) =>
  apiClient.post<MutationResponse>(`/pod/`, payload).then((r) => r.data);

export const updatePod = (
  namespace: string,
  name: string,
  payload: CreatePodRequest
) =>
  apiClient
    .put<MutationResponse>(`/pod/${namespace}/${name}`, payload)
    .then((r) => r.data);

export const deletePod = (namespace: string, name: string) =>
  apiClient
    .delete<MutationResponse>(`/pod/${namespace}/${name}`)
    .then((r) => r.data);
