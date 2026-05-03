import type { ObjectMeta } from "./shared";

export interface Secret {
  metadata: ObjectMeta;
  type?: string;
  data?: Record<string, string>;
  immutable?: boolean;
}

export interface SecretList {
  items: Secret[];
}

export interface CreateSecretRequest {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  type?: string;
  stringData?: Record<string, string>;
  immutable?: boolean;
}
