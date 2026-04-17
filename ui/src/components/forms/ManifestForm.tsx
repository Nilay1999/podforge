import type { ReactElement } from "react";
import type {
  CreateConfigMapRequest,
  CreateDeploymentRequest,
  CreatePodRequest,
  ResourceKind,
} from "../../types";
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
}

export function ManifestForm<K extends ResourceKind>({
  kind,
  formId,
  onSubmit,
}: ManifestFormProps<K>): ReactElement {
  switch (kind) {
    case "Deployment":
      return (
        <DeploymentManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateDeploymentRequest) => void}
        />
      );
    case "ConfigMap":
      return (
        <ConfigMapManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateConfigMapRequest) => void}
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
