import type {
  Affinity,
  DNSConfig,
  DNSPolicy,
  HostAlias,
  ObjectMeta,
  PodSecurityContext,
  ResourceList,
  RestartPolicy,
  SidecarContainer,
  Toleration,
  TopologySpreadConstraint,
  Volume
} from "./shared";

export interface CreatePodRequest {
  name: string;
  namespace: string;

  labels?: Record<string, string>;
  annotations?: Record<string, string>;

  containers: SidecarContainer[];
  initContainers?: SidecarContainer[];

  volumes?: Volume[];

  serviceAccount?: string;
  automountServiceAccountToken?: boolean;
  imagePullSecrets?: string[];

  nodeName?: string;
  nodeSelector?: Record<string, string>;
  affinity?: Affinity;
  tolerations?: Toleration[];
  topologySpreadConstraints?: TopologySpreadConstraint[];
  priorityClassName?: string;
  priority?: number;
  preemptionPolicy?: "PreemptLowerPriority" | "Never";
  runtimeClassName?: string;
  schedulerName?: string;

  securityContext?: PodSecurityContext;

  dnsPolicy?: DNSPolicy;
  dnsConfig?: DNSConfig;

  hostNetwork?: boolean;
  hostPID?: boolean;
  hostIPC?: boolean;
  hostname?: string;
  subdomain?: string;
  hostAliases?: HostAlias[];

  restartPolicy?: RestartPolicy;
  terminationGracePeriodSeconds?: number;
  activeDeadlineSeconds?: number;

  readinessGates?: { conditionType: string }[];

  overhead?: ResourceList;
  enableServiceLinks?: boolean;
}

export type PodPhase = "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";

export interface PodCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  image: string;
  imageID?: string;
  state?: Record<string, unknown>;
}

export interface PodStatus {
  phase?: PodPhase;
  message?: string;
  reason?: string;
  podIP?: string;
  hostIP?: string;
  startTime?: string;
  conditions?: PodCondition[];
  containerStatuses?: ContainerStatus[];
}

export interface PodSpec {
  nodeName?: string;
  serviceAccount?: string;
  restartPolicy?: RestartPolicy;
  containers?: { name: string; image: string }[];
}

export interface Pod {
  metadata: ObjectMeta;
  spec?: PodSpec;
  status?: PodStatus;
}

export interface PodList {
  items: Pod[];
}

export interface PodEvent {
  type: string;
  reason: string;
  message: string;
  count?: number;
  lastTimestamp?: string;
  firstTimestamp?: string;
}

export interface PodOverview {
  pod?: Pod;
  events?: PodEvent[];
}
