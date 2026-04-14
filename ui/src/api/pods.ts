import { apiClient } from "./client";

export interface Pod {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  status?: {
    phase?: string;
    podIP?: string;
    hostIP?: string;
  };
  spec?: {
    nodeName?: string;
    containers?: { name: string; image: string }[];
  };
}

export interface PodList {
  items: Pod[];
}

export interface MutationResponse {
  name: string;
  namespace: string;
  status: string;
}

export const listPods = (namespace: string) =>
  apiClient.get<PodList>(`/pod/${namespace}`).then((r) => r.data);

export const getPod = (namespace: string, name: string) =>
  apiClient.get<Pod>(`/pod/${namespace}/${name}`).then((r) => r.data);

export const deletePod = (namespace: string, name: string) =>
  apiClient
    .delete<MutationResponse>(`/pod/${namespace}/${name}`)
    .then((r) => r.data);
