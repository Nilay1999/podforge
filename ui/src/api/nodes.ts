import { apiClient } from "./client";
import type { NodeList, Node } from "@src/types";

export const listNodes = () => apiClient.get<NodeList>("/node/").then((r) => r.data);

export const getNode = (name: string) =>
  apiClient.get<Node>(`/node/${name}`).then((r) => r.data);
