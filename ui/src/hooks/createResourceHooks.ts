import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { MutationResponse } from "../types";

export interface ResourceApi<TItem, TList, TCreate> {
  list: (namespace: string) => Promise<TList>;
  get: (namespace: string, name: string) => Promise<TItem>;
  create: (payload: TCreate) => Promise<MutationResponse>;
  update: (
    namespace: string,
    name: string,
    payload: TCreate,
  ) => Promise<MutationResponse>;
  remove: (namespace: string, name: string) => Promise<MutationResponse>;
}

export function createResourceHooks<TItem, TList, TCreate>(
  resource: string,
  api: ResourceApi<TItem, TList, TCreate>,
) {
  const keys = {
    all: [resource] as const,
    list: (namespace: string) => [resource, "list", namespace] as const,
    detail: (namespace: string, name: string) =>
      [resource, "detail", namespace, name] as const,
  };

  const useList = (
    namespace: string,
    options?: Partial<UseQueryOptions<TList, Error>>,
  ) =>
    useQuery<TList, Error>({
      queryKey: keys.list(namespace),
      queryFn: () => api.list(namespace),
      refetchInterval: 15000,
      ...options,
    });

  const useDetail = (
    namespace: string,
    name: string,
    options?: Partial<UseQueryOptions<TItem, Error>>,
  ) =>
    useQuery<TItem, Error>({
      queryKey: keys.detail(namespace, name),
      queryFn: () => api.get(namespace, name),
      enabled: Boolean(namespace && name),
      ...options,
    });

  const useCreate = (
    options?: UseMutationOptions<MutationResponse, Error, TCreate>,
  ) => {
    const qc = useQueryClient();
    return useMutation<MutationResponse, Error, TCreate>({
      mutationFn: api.create,
      ...options,
      onSuccess: (...args) => {
        qc.invalidateQueries({ queryKey: keys.all });
        options?.onSuccess?.(...args);
      },
    });
  };

  const useUpdate = (
    namespace: string,
    name: string,
    options?: UseMutationOptions<MutationResponse, Error, TCreate>,
  ) => {
    const qc = useQueryClient();
    return useMutation<MutationResponse, Error, TCreate>({
      mutationFn: (payload) => api.update(namespace, name, payload),
      ...options,
      onSuccess: (...args) => {
        qc.invalidateQueries({ queryKey: keys.all });
        options?.onSuccess?.(...args);
      },
    });
  };

  const useRemove = (
    namespace: string,
    options?: UseMutationOptions<MutationResponse, Error, string>,
  ) => {
    const qc = useQueryClient();
    return useMutation<MutationResponse, Error, string>({
      mutationFn: (name) => api.remove(namespace, name),
      ...options,
      onSuccess: (...args) => {
        qc.invalidateQueries({ queryKey: keys.list(namespace) });
        options?.onSuccess?.(...args);
      },
    });
  };

  return { keys, useList, useDetail, useCreate, useUpdate, useRemove };
}
