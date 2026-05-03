import { apiClient } from "./client";
import type { Service, ServiceList, CreateServiceRequest, MutationResponse } from "@src/types";

export const listServices = (namespace: string) =>
  apiClient.get<ServiceList>(`/service/${namespace}`).then((r) => r.data);

export const getService = (namespace: string, name: string) =>
  apiClient.get<Service>(`/service/${namespace}/${name}`).then((r) => r.data);

export const createService = (payload: CreateServiceRequest) =>
  apiClient.post<MutationResponse>("/service/", payload).then((r) => r.data);

export const updateService = (namespace: string, name: string, payload: CreateServiceRequest) =>
  apiClient.put<MutationResponse>(`/service/${namespace}/${name}`, payload).then((r) => r.data);

export const deleteService = (namespace: string, name: string) =>
  apiClient.delete<MutationResponse>(`/service/${namespace}/${name}`).then((r) => r.data);
