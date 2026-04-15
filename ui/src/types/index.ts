export * from "./shared";
export * from "./pod";
export * from "./deployment";
export * from "./configmap";

// Resource kind discriminator — useful for generic editor/form components
export type ResourceKind = "Pod" | "Deployment" | "ConfigMap";
