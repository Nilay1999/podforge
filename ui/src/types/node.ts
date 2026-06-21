import type { ObjectMeta } from "./shared";

export interface NodeAddress {
  type: string;
  address: string;
}

export interface NodeCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastHeartbeatTime?: string;
  lastTransitionTime?: string;
}

export interface NodeTaint {
  key: string;
  value?: string;
  effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
}

export interface NodeSystemInfo {
  kernelVersion?: string;
  osImage?: string;
  containerRuntimeVersion?: string;
  kubeletVersion?: string;
  operatingSystem?: string;
  architecture?: string;
}

export interface NodeStatus {
  capacity?: Record<string, string>;
  allocatable?: Record<string, string>;
  conditions?: NodeCondition[];
  addresses?: NodeAddress[];
  nodeInfo?: NodeSystemInfo;
}

export interface NodeSpec {
  podCIDR?: string;
  providerID?: string;
  unschedulable?: boolean;
  taints?: NodeTaint[];
}

export interface Node {
  metadata: ObjectMeta;
  spec?: NodeSpec;
  status?: NodeStatus;
}

export interface NodeList {
  items: Node[];
}
