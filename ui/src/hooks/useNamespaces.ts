import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as namespacesApi from "@src/api/namespaces";
import type { CreateNamespaceRequest } from "@src/types";
import { DEFAULT_NAMESPACES } from "@src/utils/constants";

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

export const useNamespaceOptions = (include?: string) => {
  const { data, isLoading } = useNamespaces();

  const names = (data?.items ?? [])
    .map((ns) => ns.metadata.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));

  const options = names.length > 0 ? names : DEFAULT_NAMESPACES;

  return {
    options: include && !options.includes(include) ? [include, ...options] : options,
    isLoading
  };
};

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
