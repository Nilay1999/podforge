export interface ObjectMeta {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  uid?: string;
  resourceVersion?: string;
}

export interface ContainerPort {
  name?: string;
  containerPort: number;
  protocol?: "TCP" | "UDP" | "SCTP";
  hostPort?: number;
}

export interface EnvFrom {
  configMapRef?: string;
  secretRef?: string;
  prefix?: string;
}

export type ImagePullPolicy = "Always" | "IfNotPresent" | "Never";

export interface ResourceList {
  cpu?: string;
  memory?: string;
  ephemeralStorage?: string;
}

export interface ResourceRequirements {
  requests?: ResourceList;
  limits?: ResourceList;
}

export interface HTTPGetAction {
  path: string;
  port: number;
  httpHeaders?: Record<string, string>;
}

export interface ExecAction {
  command: string[];
}

export interface TCPSocketAction {
  port: number;
}

export interface Probe {
  httpGet?: HTTPGetAction;
  exec?: ExecAction;
  tcpSocket?: TCPSocketAction;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

export interface LifecycleHandler {
  exec?: ExecAction;
  httpGet?: HTTPGetAction;
}

export interface Lifecycle {
  postStart?: LifecycleHandler;
  preStop?: LifecycleHandler;
}

export interface Capabilities {
  add?: string[];
  drop?: string[];
}

export interface ContainerSecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  readOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
  privileged?: boolean;
  capabilities?: Capabilities;
}

export interface PodSecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  fsGroup?: number;
}

export interface KeyToPath {
  key: string;
  path: string;
  mode?: number;
}

export interface ConfigMapVolumeSource {
  name: string;
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
}

export interface SecretVolumeSource {
  secretName: string;
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
}

export interface EmptyDirVolumeSource {
  medium?: "" | "Memory" | "HugePages";
  sizeLimit?: string;
}

export interface PVCVolumeSource {
  claimName: string;
  readOnly?: boolean;
}

export interface HostPathVolumeSource {
  path: string;
  type?: "Directory" | "File" | "Socket" | "CharDevice" | "BlockDevice";
}

export interface Volume {
  name: string;
  configMap?: ConfigMapVolumeSource;
  secret?: SecretVolumeSource;
  emptyDir?: EmptyDirVolumeSource;
  persistentVolumeClaim?: PVCVolumeSource;
  hostPath?: HostPathVolumeSource;
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
}

export interface SidecarContainer {
  name: string;
  image: string;
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
  securityContext?: ContainerSecurityContext;
}

export interface Toleration {
  key?: string;
  operator?: "Equal" | "Exists";
  value?: string;
  effect?: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
  tolerationSeconds?: number;
}

export interface NodeSelectorRequirement {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";
  values?: string[];
}

export interface PreferredNodeExpression {
  weight: number;
  matchExpressions: NodeSelectorRequirement[];
}

export interface NodeAffinity {
  requiredMatchExpressions?: NodeSelectorRequirement[];
  preferredMatchExpressions?: PreferredNodeExpression[];
}

export interface LabelSelectorRequirement {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist";
  values?: string[];
}

export interface PodAffinityTerm {
  topologyKey: string;
  matchLabels?: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
  namespaces?: string[];
}

export interface WeightedPodAffinityTerm {
  weight: number;
  podAffinityTerm: PodAffinityTerm;
}

export interface PodAffinity {
  required?: PodAffinityTerm[];
  preferred?: WeightedPodAffinityTerm[];
}

export interface Affinity {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAffinity;
}

export interface TopologySpreadConstraint {
  maxSkew: number;
  topologyKey: string;
  whenUnsatisfiable: "DoNotSchedule" | "ScheduleAnyway";
  matchLabels?: Record<string, string>;
}

export interface DNSConfigOption {
  name: string;
  value?: string;
}

export interface DNSConfig {
  nameservers?: string[];
  searches?: string[];
  options?: DNSConfigOption[];
}

export interface HostAlias {
  ip: string;
  hostnames: string[];
}

export type DNSPolicy =
  | "ClusterFirst"
  | "ClusterFirstWithHostNet"
  | "Default"
  | "None";

export type RestartPolicy = "Always" | "OnFailure" | "Never";

export interface MutationResponse {
  name: string;
  namespace: string;
  status: string;
}
