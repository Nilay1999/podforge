import type { ObjectMeta } from "./shared";

export interface Namespace {
  metadata: ObjectMeta;
  status?: {
    phase?: "Active" | "Terminating";
  };
}

export interface NamespaceList {
  items: Namespace[];
}

export interface CreateNamespaceRequest {
  name: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}
