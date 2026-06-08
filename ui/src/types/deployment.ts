import type {
  Affinity,
  ContainerPort,
  ContainerSecurityContext,
  DNSPolicy,
  EnvFrom,
  ImagePullPolicy,
  Lifecycle,
  ObjectMeta,
  PodSecurityContext,
  Probe,
  ResourceRequirements,
  SidecarContainer,
  Toleration,
  TopologySpreadConstraint,
  Volume,
  VolumeMount
} from "./shared";

export interface DeploymentStrategy {
  type?: "RollingUpdate" | "Recreate";
  maxSurge?: string;
  maxUnavailable?: string;
}

export interface CreateDeploymentRequest {
  name: string;
  namespace: string;
  image: string;
  replicas: number;

  labels?: Record<string, string>;
  annotations?: Record<string, string>;

  // Primary container
  command?: string[];
  args?: string[];
  workingDir?: string;
  ports?: ContainerPort[];
  envVars?: Record<string, string>;
  envFrom?: EnvFrom[];
  imagePullPolicy?: ImagePullPolicy;
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
  livenessProbe?: Probe;
  readinessProbe?: Probe;
  startupProbe?: Probe;
  lifecycle?: Lifecycle;
  containerSecurityContext?: ContainerSecurityContext;

  // Additional containers
  sidecars?: SidecarContainer[];
  initContainers?: SidecarContainer[];

  // Pod-level
  volumes?: Volume[];
  imagePullSecrets?: string[];
  serviceAccount?: string;
  nodeSelector?: Record<string, string>;
  nodeName?: string;
  tolerations?: Toleration[];
  affinity?: Affinity;
  topologySpreadConstraints?: TopologySpreadConstraint[];
  podSecurityContext?: PodSecurityContext;
  terminationGracePeriodSeconds?: number;
  priorityClassName?: string;
  runtimeClassName?: string;
  dnsPolicy?: DNSPolicy;

  // Rollout
  strategy?: DeploymentStrategy;
  minReadySeconds?: number;
  revisionHistoryLimit?: number;
  progressDeadlineSeconds?: number;
}

export interface DeploymentCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastUpdateTime?: string;
}

export interface DeploymentStatus {
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
  updatedReplicas?: number;
  observedGeneration?: number;
  conditions?: DeploymentCondition[];
}

export interface DeploymentSpec {
  replicas?: number;
  strategy?: DeploymentStrategy;
  selector?: { matchLabels?: Record<string, string> };
}

export interface Deployment {
  metadata: ObjectMeta;
  spec?: DeploymentSpec;
  status?: DeploymentStatus;
}

export interface DeploymentList {
  items: Deployment[];
}
