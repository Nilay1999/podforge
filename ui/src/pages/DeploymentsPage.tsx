import { Text } from "@mantine/core";
import {
  ResourceListPage,
  formatAge,
  type Column,
} from "@src/components/common/ResourceListPage";
import { useDeleteDeployment, useDeployments } from "@src/hooks/useDeployments";
import type { Deployment } from "@src/types";

const columns: Column<Deployment>[] = [
  {
    header: "Name",
    render: (d) => (
      <Text size="sm" ff="monospace" fw={500}>
        {d.metadata.name}
      </Text>
    ),
  },
  {
    header: "Ready",
    render: (d) => {
      const ready = d.status?.readyReplicas ?? 0;
      const total = d.spec?.replicas ?? d.status?.replicas ?? 0;
      return (
        <Text size="sm" ff="monospace">
          {total > 0 ? `${ready}/${total}` : "–"}
        </Text>
      );
    },
  },
  {
    header: "Available",
    render: (d) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {d.status?.availableReplicas ?? "–"}
      </Text>
    ),
  },
  {
    header: "Updated",
    render: (d) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {d.status?.updatedReplicas ?? "–"}
      </Text>
    ),
  },
  {
    header: "Strategy",
    render: (d) => (
      <Text size="sm" c="dimmed">
        {d.spec?.strategy?.type ?? "RollingUpdate"}
      </Text>
    ),
  },
  {
    header: "Age",
    render: (d) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(d.metadata.creationTimestamp)}
      </Text>
    ),
  },
];

export function DeploymentsPage() {
  return (
    <ResourceListPage<Deployment>
      kind="Deployment"
      pluralTitle="Deployments"
      useList={useDeployments}
      useDelete={useDeleteDeployment}
      columns={columns}
    />
  );
}
