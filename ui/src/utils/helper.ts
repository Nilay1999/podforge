import type { Kind } from "@src/types";

export const kindPicker: Record<Kind, string> = {
  // Core
  pod: "Pod",
  service: "Service",
  configmap: "ConfigMap",
  secret: "Secret",
  persistentvolume: "PersistentVolume",
  persistentvolumeclaim: "PersistentVolumeClaim",
  namespace: "Namespace",
  node: "Node",
  event: "Event",
  limitrange: "LimitRange",
  resourcequota: "ResourceQuota",
  serviceaccount: "ServiceAccount",

  // Workloads
  deployment: "Deployment",
  replicaset: "ReplicaSet",
  statefulset: "StatefulSet",
  daemonset: "DaemonSet",
  job: "Job",
  cronjob: "CronJob",

  // Networking
  ingress: "Ingress",
  networkpolicy: "NetworkPolicy",

  // RBAC
  role: "Role",
  rolebinding: "RoleBinding",
  clusterrole: "ClusterRole",
  clusterrolebinding: "ClusterRoleBinding",

  // Storage
  storageclass: "StorageClass",
  volumeattachment: "VolumeAttachment",

  // Autoscaling
  horizontalpodautoscaler: "HorizontalPodAutoscaler",

  // Policy / scheduling
  poddisruptionbudget: "PodDisruptionBudget",
  priorityclass: "PriorityClass",

  // Misc
  endpoint: "Endpoints",
  endpointslice: "EndpointSlice",
  runtimeclass: "RuntimeClass"
};
