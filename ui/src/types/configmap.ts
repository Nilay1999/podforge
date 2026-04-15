import type { ObjectMeta } from "./shared";

export interface CreateConfigMapRequest {
  name: string;
  namespace: string;

  labels?: Record<string, string>;
  annotations?: Record<string, string>;

  data?: Record<string, string>;
  binaryData?: Record<string, string>; // base64-encoded strings over the wire

  immutable?: boolean;
}

export interface ConfigMap {
  metadata: ObjectMeta;
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

export interface ConfigMapList {
  items: ConfigMap[];
}
