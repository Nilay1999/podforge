import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as namespacesApi from "@src/api/namespaces";
import type { CreateNamespaceRequest } from "@src/types";

const KEYS = {
  all: ["namespaces"] as const,
  list: () => ["namespaces", "list"] as const
};

export const useNamespaces = () =>
  useQuery({
    queryKey: KEYS.list(),
    queryFn: namespacesApi.listNamespaces,
    refetchInterval: 15_000
  });

export const useCreateNamespace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNamespaceRequest) => namespacesApi.createNamespace(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all })
  });
};

export const useDeleteNamespace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => namespacesApi.deleteNamespace(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all })
  });
};
