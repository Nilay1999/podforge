import { useState } from "react";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ResourceListPage, formatAge, type Column } from "@src/components/common/ResourceListPage";
import { useDeleteDeployment, useDeployments } from "@src/hooks/useDeployments";
import { updateDeployment } from "@src/api/deployments";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import { DeploymentDetailDrawer } from "@src/components/deployments/DeploymentDetailDrawer";
import { useEditManifestDrawer } from "@src/hooks/useEditManifestDrawer";
import type { Deployment } from "@src/types";

const columns: Column<Deployment>[] = [
  {
    header: "Name",
    render: (d) => (
      <Text size="sm" ff="monospace" fw={500}>
        {d.metadata.name}
      </Text>
    )
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
    }
  },
  {
    header: "Available",
    render: (d) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {d.status?.availableReplicas ?? "–"}
      </Text>
    )
  },
  {
    header: "Updated",
    render: (d) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {d.status?.updatedReplicas ?? "–"}
      </Text>
    )
  },
  {
    header: "Strategy",
    render: (d) => (
      <Text size="sm" c="dimmed">
        {d.spec?.strategy?.type ?? "RollingUpdate"}
      </Text>
    )
  },
  {
    header: "Age",
    render: (d) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(d.metadata.creationTimestamp)}
      </Text>
    )
  }
];

export function DeploymentsPage() {
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload } =
    useEditManifestDrawer<Deployment>("Deployment", updateDeployment, "deployments");

  const deleteDeployment = useDeleteDeployment(selectedDeployment?.metadata.namespace ?? "default");

  const handleDelete = () => {
    if (!selectedDeployment) return;
    deleteDeployment.mutate(selectedDeployment.metadata.name, {
      onSuccess: () => {
        notifications.show({
          title: "Deployment deleted",
          message: selectedDeployment.metadata.name,
          color: "teal"
        });
        setSelectedDeployment(null);
      },
      onError: (err) =>
        notifications.show({ title: "Delete failed", message: err.message, color: "red" })
    });
  };

  return (
    <>
      <ManifestDrawer
        opened={editDrawerOpened}
        onClose={closeEditDrawer}
        kind="Deployment"
        initialPayload={editInitialPayload}
        onApply={handleEditApply}
      />

      <DeploymentDetailDrawer
        deployment={selectedDeployment}
        onClose={() => setSelectedDeployment(null)}
        onEdit={selectedDeployment ? () => handleEditItem(selectedDeployment) : undefined}
        onDelete={handleDelete}
      />

      <ResourceListPage<Deployment>
        kind="Deployment"
        pluralTitle="Deployments"
        useList={useDeployments}
        useDelete={useDeleteDeployment}
        columns={columns}
        onRowClick={setSelectedDeployment}
        onEditItem={handleEditItem}
      />
    </>
  );
}
