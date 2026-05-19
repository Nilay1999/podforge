import { apiClient } from "./client";
import type {
  CreateDeploymentRequest,
  Deployment,
  DeploymentList,
  MutationResponse
} from "@src/types";

export const listDeployments = (namespace: string) =>
  apiClient.get<DeploymentList>(`/deployment/${namespace}`).then((r) => r.data);

export const getDeployment = (namespace: string, name: string) =>
  apiClient.get<Deployment>(`/deployment/${namespace}/${name}`).then((r) => r.data);

export const createDeployment = (payload: CreateDeploymentRequest) =>
  apiClient.post<MutationResponse>(`/deployment/`, payload).then((r) => r.data);

export const updateDeployment = (
  namespace: string,
  name: string,
  payload: CreateDeploymentRequest
) =>
  apiClient.put<MutationResponse>(`/deployment/${namespace}/${name}`, payload).then((r) => r.data);

export const deleteDeployment = (namespace: string, name: string) =>
  apiClient.delete<MutationResponse>(`/deployment/${namespace}/${name}`).then((r) => r.data);

export const scaleDeployment = (namespace: string, name: string, replicas: number) =>
  apiClient
    .patch<MutationResponse>(`/deployment/${namespace}/${name}/scale`, { replicas })
    .then((r) => r.data);

export const restartDeployment = (namespace: string, name: string) =>
  apiClient.post<MutationResponse>(`/deployment/${namespace}/${name}/restart`).then((r) => r.data);

export const getDeploymentOverview = (namespace: string, name: string) =>
  apiClient.get(`/deployment/${namespace}/${name}/overview`).then((r) => r.data);
