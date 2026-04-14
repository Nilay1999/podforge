import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePod, listPods } from "../api/pods";

export const podKeys = {
  all: ["pods"] as const,
  list: (namespace: string) => [...podKeys.all, namespace] as const,
};

export const usePods = (namespace: string) =>
  useQuery({
    queryKey: podKeys.list(namespace),
    queryFn: () => listPods(namespace),
    refetchInterval: 5000,
  });

export const useDeletePod = (namespace: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deletePod(namespace, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: podKeys.list(namespace) });
    },
  });
};
