import { useState } from "react";
import { Badge, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ResourceListPage, formatAge, type Column } from "@src/components/common/ResourceListPage";
import { useDeletePod, usePods } from "@src/hooks/usePods";
import { updatePod } from "@src/api/pods";
import { PodDetailDrawer } from "@src/components/pods/PodDetailDrawer";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import { useEditManifestDrawer } from "@src/hooks/useEditManifestDrawer";
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
    )
  },
  {
    header: "Status",
    render: (p) => (
      <Badge color={phaseColor(p.status?.phase)} variant="light" size="sm">
        {p.status?.phase ?? "Unknown"}
      </Badge>
    )
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
    }
  },
  {
    header: "Restarts",
    render: (p) => {
      const restarts = (p.status?.containerStatuses ?? []).reduce((s, c) => s + c.restartCount, 0);
      return (
        <Text size="sm" ff="monospace" c={restarts > 0 ? "warning" : "dimmed"}>
          {restarts}
        </Text>
      );
    }
  },
  {
    header: "Node",
    render: (p) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {p.spec?.nodeName ?? "–"}
      </Text>
    )
  },
  {
    header: "Age",
    render: (p) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(p.metadata.creationTimestamp)}
      </Text>
    )
  }
];

export function PodsPage() {
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);

  const { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload } =
    useEditManifestDrawer<Pod>("Pod", updatePod, "pods");

  const deleteNs = selectedPod?.metadata.namespace ?? "default";
  const deletePodMutation = useDeletePod(deleteNs);

  const handleDelete = () => {
    if (!selectedPod) return;
    deletePodMutation.mutate(selectedPod.metadata.name, {
      onSuccess: () => {
        setSelectedPod(null);
        notifications.show({
          title: "Pod deleted",
          message: `${selectedPod.metadata.name} was deleted`,
          color: "teal"
        });
      },
      onError: (err) =>
        notifications.show({
          title: "Delete failed",
          message: err.message,
          color: "red"
        })
    });
  };

  return (
    <>
      <PodDetailDrawer
        pod={selectedPod}
        onClose={() => setSelectedPod(null)}
        onDelete={handleDelete}
        onEdit={
          selectedPod
            ? () => {
                setSelectedPod(null);
                handleEditItem(selectedPod);
              }
            : undefined
        }
      />

      <ManifestDrawer
        opened={editDrawerOpened}
        onClose={closeEditDrawer}
        kind="Pod"
        initialPayload={editInitialPayload}
        onApply={handleEditApply}
      />

      <ResourceListPage<Pod>
        kind="Pod"
        pluralTitle="Pods"
        useList={usePods}
        useDelete={useDeletePod}
        columns={columns}
        onRowClick={setSelectedPod}
        onEditItem={handleEditItem}
      />
    </>
  );
}
