import { useQuery } from "@tanstack/react-query";
import * as nodesApi from "@src/api/nodes";

const KEYS = {
  all: ["nodes"] as const,
  list: () => ["nodes", "list"] as const,
  detail: (name: string) => ["nodes", "detail", name] as const
};

export const useNodes = () =>
  useQuery({
    queryKey: KEYS.list(),
    queryFn: nodesApi.listNodes,
    refetchInterval: 15_000
  });

export const useNode = (name: string | null) =>
  useQuery({
    queryKey: KEYS.detail(name ?? ""),
    queryFn: () => nodesApi.getNode(name as string),
    enabled: !!name
  });
