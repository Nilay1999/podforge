export * from "./shared";
export * from "./pod";
export * from "./deployment";
export * from "./configmap";
export * from "./service";
export * from "./secret";
export * from "./namespace";
export * from "./node";
export * from "./event";
export * from "./auth";
export * from "./apply";

export type ResourceKind = "Pod" | "Deployment" | "ConfigMap" | "Service" | "Secret";
