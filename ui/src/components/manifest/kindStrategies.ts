import type {
  CreateConfigMapRequest,
  CreateDeploymentRequest,
  CreatePodRequest,
  ResourceKind,
} from "@src/types";

export type AnyPayload =
  | CreateConfigMapRequest
  | CreateDeploymentRequest
  | CreatePodRequest;

export interface KindStrategy {
  initialPayload: AnyPayload;
  toManifest: (payload: AnyPayload) => object;
  fromManifest: (raw: unknown) => AnyPayload;
}

function configMapToManifest(p: CreateConfigMapRequest): object {
  const metadata: Record<string, unknown> = {
    name: p.name || "",
    namespace: p.namespace || "default",
  };
  if (p.labels && Object.keys(p.labels).length) metadata.labels = p.labels;
  if (p.annotations && Object.keys(p.annotations).length)
    metadata.annotations = p.annotations;

  const manifest: Record<string, unknown> = {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata,
  };
  if (p.data && Object.keys(p.data).length) manifest.data = p.data;
  if (p.binaryData && Object.keys(p.binaryData).length)
    manifest.binaryData = p.binaryData;
  if (p.immutable) manifest.immutable = p.immutable;
  return manifest;
}

function configMapFromManifest(raw: unknown): CreateConfigMapRequest {
  const m = raw as Record<string, any>;
  return {
    name: m?.metadata?.name ?? "",
    namespace: m?.metadata?.namespace ?? "default",
    labels: m?.metadata?.labels,
    annotations: m?.metadata?.annotations,
    data: m?.data,
    binaryData: m?.binaryData,
    immutable: m?.immutable,
  };
}

function deploymentToManifest(p: CreateDeploymentRequest): object {
  const metadata: Record<string, unknown> = {
    name: p.name || "",
    namespace: p.namespace || "default",
  };
  if (p.labels && Object.keys(p.labels).length) metadata.labels = p.labels;
  if (p.annotations && Object.keys(p.annotations).length)
    metadata.annotations = p.annotations;

  const container: Record<string, unknown> = {
    name: p.name || "app",
    image: p.image || "",
  };
  if (p.imagePullPolicy) container.imagePullPolicy = p.imagePullPolicy;
  if (p.command?.length) container.command = p.command;
  if (p.args?.length) container.args = p.args;
  if (p.workingDir) container.workingDir = p.workingDir;
  if (p.ports?.length) container.ports = p.ports;
  if (p.envVars && Object.keys(p.envVars).length)
    container.env = Object.entries(p.envVars).map(([name, value]) => ({
      name,
      value,
    }));
  if (p.envFrom?.length)
    container.envFrom = p.envFrom.map((e) => ({
      ...(e.configMapRef ? { configMapRef: { name: e.configMapRef } } : {}),
      ...(e.secretRef ? { secretRef: { name: e.secretRef } } : {}),
      ...(e.prefix ? { prefix: e.prefix } : {}),
    }));
  if (p.resources) container.resources = p.resources;
  if (p.livenessProbe) container.livenessProbe = p.livenessProbe;
  if (p.readinessProbe) container.readinessProbe = p.readinessProbe;
  if (p.startupProbe) container.startupProbe = p.startupProbe;
  if (p.containerSecurityContext)
    container.securityContext = p.containerSecurityContext;

  const podSpec: Record<string, unknown> = { containers: [container] };
  if (p.serviceAccount) podSpec.serviceAccountName = p.serviceAccount;
  if (p.imagePullSecrets?.length)
    podSpec.imagePullSecrets = p.imagePullSecrets.map((s) => ({ name: s }));
  if (p.nodeSelector && Object.keys(p.nodeSelector).length)
    podSpec.nodeSelector = p.nodeSelector;
  if (p.nodeName) podSpec.nodeName = p.nodeName;
  if (p.tolerations?.length) podSpec.tolerations = p.tolerations;
  if (p.dnsPolicy) podSpec.dnsPolicy = p.dnsPolicy;
  if (p.terminationGracePeriodSeconds != null)
    podSpec.terminationGracePeriodSeconds = p.terminationGracePeriodSeconds;
  if (p.priorityClassName) podSpec.priorityClassName = p.priorityClassName;
  if (p.runtimeClassName) podSpec.runtimeClassName = p.runtimeClassName;
  if (p.podSecurityContext) podSpec.securityContext = p.podSecurityContext;

  const spec: Record<string, unknown> = {
    replicas: p.replicas ?? 1,
    selector: { matchLabels: p.labels ?? {} },
    template: { metadata: { labels: p.labels ?? {} }, spec: podSpec },
  };
  if (p.strategy?.type) {
    spec.strategy = {
      type: p.strategy.type,
      ...(p.strategy.type === "RollingUpdate"
        ? {
            rollingUpdate: {
              ...(p.strategy.maxSurge ? { maxSurge: p.strategy.maxSurge } : {}),
              ...(p.strategy.maxUnavailable
                ? { maxUnavailable: p.strategy.maxUnavailable }
                : {}),
            },
          }
        : {}),
    };
  }
  if (p.minReadySeconds) spec.minReadySeconds = p.minReadySeconds;
  if (p.revisionHistoryLimit != null)
    spec.revisionHistoryLimit = p.revisionHistoryLimit;
  if (p.progressDeadlineSeconds)
    spec.progressDeadlineSeconds = p.progressDeadlineSeconds;

  return { apiVersion: "apps/v1", kind: "Deployment", metadata, spec };
}

function deploymentFromManifest(raw: unknown): CreateDeploymentRequest {
  const m = raw as Record<string, any>;
  const podSpec = m?.spec?.template?.spec ?? {};
  const container = podSpec?.containers?.[0] ?? {};
  const rollingUpdate = m?.spec?.strategy?.rollingUpdate ?? {};

  const envVars: Record<string, string> | undefined = container.env?.length
    ? Object.fromEntries(container.env.map((e: any) => [e.name, e.value ?? ""]))
    : undefined;

  const envFrom = container.envFrom?.map((e: any) => ({
    ...(e.configMapRef ? { configMapRef: e.configMapRef.name } : {}),
    ...(e.secretRef ? { secretRef: e.secretRef.name } : {}),
    ...(e.prefix ? { prefix: e.prefix } : {}),
  }));

  const imagePullSecrets = podSpec.imagePullSecrets?.map((s: any) => s.name);

  return {
    name: m?.metadata?.name ?? "",
    namespace: m?.metadata?.namespace ?? "default",
    image: container.image ?? "",
    replicas: m?.spec?.replicas ?? 1,
    labels: m?.metadata?.labels,
    annotations: m?.metadata?.annotations,
    imagePullPolicy: container.imagePullPolicy,
    command: container.command,
    args: container.args,
    workingDir: container.workingDir,
    ports: container.ports,
    envVars,
    envFrom,
    resources: container.resources,
    livenessProbe: container.livenessProbe,
    readinessProbe: container.readinessProbe,
    startupProbe: container.startupProbe,
    containerSecurityContext: container.securityContext,
    serviceAccount: podSpec.serviceAccountName,
    imagePullSecrets,
    nodeSelector: podSpec.nodeSelector,
    nodeName: podSpec.nodeName,
    tolerations: podSpec.tolerations,
    dnsPolicy: podSpec.dnsPolicy,
    terminationGracePeriodSeconds: podSpec.terminationGracePeriodSeconds,
    priorityClassName: podSpec.priorityClassName,
    runtimeClassName: podSpec.runtimeClassName,
    podSecurityContext: podSpec.securityContext,
    strategy: m?.spec?.strategy?.type
      ? {
          type: m.spec.strategy.type,
          maxSurge: rollingUpdate.maxSurge,
          maxUnavailable: rollingUpdate.maxUnavailable,
        }
      : undefined,
    minReadySeconds: m?.spec?.minReadySeconds,
    revisionHistoryLimit: m?.spec?.revisionHistoryLimit,
    progressDeadlineSeconds: m?.spec?.progressDeadlineSeconds,
  };
}

function podToManifest(p: CreatePodRequest): object {
  const metadata: Record<string, unknown> = {
    name: p.name || "",
    namespace: p.namespace || "default",
  };
  if (p.labels && Object.keys(p.labels).length) metadata.labels = p.labels;
  if (p.annotations && Object.keys(p.annotations).length)
    metadata.annotations = p.annotations;

  return {
    apiVersion: "v1",
    kind: "Pod",
    metadata,
    spec: {
      containers: p.containers?.length
        ? p.containers
        : [{ name: p.name || "app", image: "" }],
      ...(p.restartPolicy ? { restartPolicy: p.restartPolicy } : {}),
      ...(p.serviceAccount ? { serviceAccountName: p.serviceAccount } : {}),
    },
  };
}

function podFromManifest(raw: unknown): CreatePodRequest {
  const m = raw as Record<string, any>;
  return {
    name: m?.metadata?.name ?? "",
    namespace: m?.metadata?.namespace ?? "default",
    labels: m?.metadata?.labels,
    annotations: m?.metadata?.annotations,
    containers: m?.spec?.containers ?? [],
    restartPolicy: m?.spec?.restartPolicy,
    serviceAccount: m?.spec?.serviceAccountName,
  };
}

export const KIND_STRATEGIES: Record<ResourceKind, KindStrategy> = {
  ConfigMap: {
    initialPayload: { name: "", namespace: "default" },
    toManifest: configMapToManifest as KindStrategy["toManifest"],
    fromManifest: configMapFromManifest,
  },
  Deployment: {
    initialPayload: { name: "", namespace: "default", image: "", replicas: 1 },
    toManifest: deploymentToManifest as KindStrategy["toManifest"],
    fromManifest: deploymentFromManifest,
  },
  Pod: {
    initialPayload: { name: "", namespace: "default", containers: [] },
    toManifest: podToManifest as KindStrategy["toManifest"],
    fromManifest: podFromManifest,
  },
};
