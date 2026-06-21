import type { Node } from "@src/types";

export function isNodeReady(node: Node): boolean {
  return node.status?.conditions?.some((c) => c.type === "Ready" && c.status === "True") ?? false;
}

export function nodeRoles(node: Node): string[] {
  const labels = node.metadata.labels ?? {};
  const roles = Object.keys(labels)
    .filter((k) => k.startsWith("node-role.kubernetes.io/"))
    .map((k) => k.replace("node-role.kubernetes.io/", ""))
    .filter(Boolean);
  return roles.length > 0 ? roles : ["<none>"];
}

export function nodeInternalIP(node: Node): string {
  return node.status?.addresses?.find((a) => a.type === "InternalIP")?.address ?? "–";
}

export function formatMemory(value?: string): string {
  if (!value) return "–";
  const match = value.match(/^(\d+)(Ki|Mi|Gi|Ti)?$/);
  if (!match) return value;
  const num = Number(match[1]);
  let bytes = num;
  switch (match[2]) {
    case "Ki":
      bytes = num * 1024;
      break;
    case "Mi":
      bytes = num * 1024 ** 2;
      break;
    case "Gi":
      bytes = num * 1024 ** 3;
      break;
    case "Ti":
      bytes = num * 1024 ** 4;
      break;
  }
  return `${(bytes / 1024 ** 3).toFixed(1)} GiB`;
}
