import { Badge, Text } from "@mantine/core";
import {
  ResourceListPage,
  formatAge,
  type Column,
} from "@src/components/common/ResourceListPage";
import { useDeletePod, usePods } from "@src/hooks/usePods";
import type { Pod } from "@src/types";

function phaseColor(phase?: string): string {
  switch (phase) {
    case "Running":
      return "success";
    case "Pending":
      return "warning";
    case "Failed":
    case "CrashLoopBackOff":
      return "danger";
    default:
      return "gray";
  }
}

const columns: Column<Pod>[] = [
  {
    header: "Name",
    render: (p) => (
      <Text size="sm" ff="monospace" fw={500}>
        {p.metadata.name}
      </Text>
    ),
  },
  {
    header: "Status",
    render: (p) => (
      <Badge color={phaseColor(p.status?.phase)} variant="light" size="sm">
        {p.status?.phase ?? "Unknown"}
      </Badge>
    ),
  },
  {
    header: "Ready",
    render: (p) => {
      const statuses = p.status?.containerStatuses ?? [];
      const ready = statuses.filter((c) => c.ready).length;
      const total = p.spec?.containers?.length ?? statuses.length;
      return (
        <Text size="sm" ff="monospace">
          {total > 0 ? `${ready}/${total}` : "–"}
        </Text>
      );
    },
  },
  {
    header: "Restarts",
    render: (p) => {
      const restarts = (p.status?.containerStatuses ?? []).reduce(
        (s, c) => s + c.restartCount,
        0,
      );
      return (
        <Text size="sm" ff="monospace" c={restarts > 0 ? "warning" : "dimmed"}>
          {restarts}
        </Text>
      );
    },
  },
  {
    header: "Node",
    render: (p) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {p.spec?.nodeName ?? "–"}
      </Text>
    ),
  },
  {
    header: "Age",
    render: (p) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(p.metadata.creationTimestamp)}
      </Text>
    ),
  },
];

export function PodsPage() {
  return (
    <ResourceListPage<Pod>
      kind="Pod"
      pluralTitle="Pods"
      useList={usePods}
      useDelete={useDeletePod}
      columns={columns}
    />
  );
}
