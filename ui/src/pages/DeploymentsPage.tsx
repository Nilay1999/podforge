import { useState } from "react";
import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  ResourceListPage,
  formatAge,
  type Column,
} from "@src/components/common/ResourceListPage";
import { useDeleteDeployment, useDeployments } from "@src/hooks/useDeployments";
import { updateDeployment } from "@src/api/deployments";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import {
  KIND_STRATEGIES,
  type AnyPayload,
} from "@src/components/manifest/kindStrategies";
import type { CreateDeploymentRequest, Deployment } from "@src/types";

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
  const qc = useQueryClient();
  const [editingDeployment, setEditingDeployment] =
    useState<Deployment | null>(null);
  const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] =
    useDisclosure(false);

  const handleEditItem = (d: Deployment) => {
    setEditingDeployment(d);
    openEditDrawer();
  };

  const handleEditApply = (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void },
  ) => {
    if (!editingDeployment) return;
    const { namespace = "default", name } = editingDeployment.metadata;
    updateDeployment(namespace, name, payload as CreateDeploymentRequest)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["deployments"] });
        opts.onSuccess();
      })
      .catch(opts.onError);
  };

  const editInitialPayload = editingDeployment
    ? (KIND_STRATEGIES["Deployment"].fromManifest(
        editingDeployment,
      ) as CreateDeploymentRequest)
    : undefined;

  return (
    <>
      <ManifestDrawer
        opened={editDrawerOpened}
        onClose={closeEditDrawer}
        kind="Deployment"
        initialPayload={editInitialPayload}
        onApply={handleEditApply}
      />

      <ResourceListPage<Deployment>
        kind="Deployment"
        pluralTitle="Deployments"
        useList={useDeployments}
        useDelete={useDeleteDeployment}
        columns={columns}
        onEditItem={handleEditItem}
      />
    </>
  );
}
