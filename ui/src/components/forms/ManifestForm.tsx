import type { ReactElement } from "react";
import type {
  CreateConfigMapRequest,
  CreateDeploymentRequest,
  CreatePodRequest,
  CreateServiceRequest,
  CreateSecretRequest,
  ResourceKind
} from "@src/types";
import { ConfigMapManifestForm } from "./ConfigMapManifestForm";
import { DeploymentManifestForm } from "./DeploymentManifestForm";
import { PodManifestForm } from "./PodManifestForm";
import { ServiceManifestForm } from "./ServiceManifestForm";
import { SecretManifestForm } from "./SecretManifestForm";

interface PayloadByKind {
  Pod: CreatePodRequest;
  Deployment: CreateDeploymentRequest;
  ConfigMap: CreateConfigMapRequest;
  Service: CreateServiceRequest;
  Secret: CreateSecretRequest;
}

interface ManifestFormProps<K extends ResourceKind> {
  kind: K;
  formId?: string;
  onSubmit?: (payload: PayloadByKind[K]) => void;
  registerGetPayload?: (fn: (() => PayloadByKind[K]) | null) => void;
  defaultPayload?: Partial<PayloadByKind[K]>;
}

export function ManifestForm<K extends ResourceKind>({
  kind,
  formId,
  onSubmit,
  registerGetPayload,
  defaultPayload
}: ManifestFormProps<K>): ReactElement {
  switch (kind) {
    case "Deployment":
      return (
        <DeploymentManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateDeploymentRequest) => void}
          registerGetPayload={
            registerGetPayload as ((fn: (() => CreateDeploymentRequest) | null) => void) | undefined
          }
          defaultPayload={defaultPayload as Partial<CreateDeploymentRequest> | undefined}
        />
      );
    case "ConfigMap":
      return (
        <ConfigMapManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateConfigMapRequest) => void}
          registerGetPayload={
            registerGetPayload as ((fn: (() => CreateConfigMapRequest) | null) => void) | undefined
          }
          defaultPayload={defaultPayload as Partial<CreateConfigMapRequest> | undefined}
        />
      );
    case "Pod":
      return (
        <PodManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreatePodRequest) => void}
          registerGetPayload={
            registerGetPayload as ((fn: (() => CreatePodRequest) | null) => void) | undefined
          }
          defaultPayload={defaultPayload as Partial<CreatePodRequest> | undefined}
        />
      );
    case "Service":
      return (
        <ServiceManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateServiceRequest) => void}
          registerGetPayload={
            registerGetPayload as ((fn: (() => CreateServiceRequest) | null) => void) | undefined
          }
          defaultPayload={defaultPayload as Partial<CreateServiceRequest> | undefined}
        />
      );
    case "Secret":
      return (
        <SecretManifestForm
          formId={formId}
          onSubmit={onSubmit as (p: CreateSecretRequest) => void}
          registerGetPayload={
            registerGetPayload as ((fn: (() => CreateSecretRequest) | null) => void) | undefined
          }
          defaultPayload={defaultPayload as Partial<CreateSecretRequest> | undefined}
        />
      );
  }
}
