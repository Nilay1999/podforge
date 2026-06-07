export * from "./shared";
export * from "./pod";
export * from "./deployment";
export * from "./configmap";
export * from "./service";
export * from "./secret";
export * from "./namespace";
export * from "./event";

export type ResourceKind = "Pod" | "Deployment" | "ConfigMap" | "Service" | "Secret";
