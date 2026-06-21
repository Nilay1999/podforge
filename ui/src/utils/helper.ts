import type { Kind } from "@src/types";

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
