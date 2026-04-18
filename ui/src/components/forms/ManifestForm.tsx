import type { ReactElement } from "react";
import type {
  CreateConfigMapRequest,
  CreateDeploymentRequest,
  CreatePodRequest,
  ResourceKind,
} from "@src/types";
import { ConfigMapManifestForm } from "./ConfigMapManifestForm";
import { DeploymentManifestForm } from "./DeploymentManifestForm";
import { PodManifestForm } from "./PodManifestForm";

interface PayloadByKind {
  Pod: CreatePodRequest;
  Deployment: CreateDeploymentRequest;
  ConfigMap: CreateConfigMapRequest;
}

interface ManifestFormProps<K extends ResourceKind> {
  kind: K;
  formId?: string;
  onSubmit?: (payload: PayloadByKind[K]) => void;
  onPayloadChange?: (payload: PayloadByKind[K]) => void;
  defaultPayload?: Partial<PayloadByKind[K]>;
}

export function ManifestForm<K extends ResourceKind>({
  kind,
  formId,
  onSubmit,
  onPayloadChange,
  defaultPayload,
}: ManifestFormProps<K>): ReactElement {
  switch (kind) {
    case "Deployment":
      return (
        <DeploymentManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateDeploymentRequest) => void}
          onPayloadChange={
            onPayloadChange as
              | ((p: CreateDeploymentRequest) => void)
              | undefined
          }
          defaultPayload={
            defaultPayload as Partial<CreateDeploymentRequest> | undefined
          }
        />
      );
    case "ConfigMap":
      return (
        <ConfigMapManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateConfigMapRequest) => void}
          onPayloadChange={
            onPayloadChange as ((p: CreateConfigMapRequest) => void) | undefined
          }
          defaultPayload={
            defaultPayload as Partial<CreateConfigMapRequest> | undefined
          }
        />
      );
    case "Pod":
      return (
        <PodManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreatePodRequest) => void}
        />
      );
  }
}
