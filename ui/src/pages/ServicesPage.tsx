import { Badge, Text } from "@mantine/core";
import { ResourceListPage, formatAge, type Column } from "@src/components/common/ResourceListPage";
import { useServices, useDeleteService } from "@src/hooks/useServices";
import { updateService } from "@src/api/services";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import { useEditManifestDrawer } from "@src/hooks/useEditManifestDrawer";
import type { Service, ServicePort } from "@src/types";

function formatPorts(ports?: ServicePort[]): string {
  if (!ports?.length) return "—";
  return ports.map((p) => `${p.port}${p.targetPort ? `:${p.targetPort}` : ""}/${p.protocol ?? "TCP"}`).join(", ");
}

const columns: Column<Service>[] = [
  {
    header: "Name",
    render: (s) => (
      <Text size="sm" ff="monospace" fw={500}>
        {s.metadata.name}
      </Text>
    )
  },
  {
    header: "Type",
    render: (s) => (
      <Badge variant="light" size="sm" color="steelBlue">
        {s.spec?.type ?? "ClusterIP"}
      </Badge>
    )
  },
  {
    header: "Cluster IP",
    render: (s) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {s.spec?.clusterIP ?? "—"}
      </Text>
    )
  },
  {
    header: "Ports",
    render: (s) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatPorts(s.spec?.ports)}
      </Text>
    )
  },
  {
    header: "Age",
    render: (s) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(s.metadata.creationTimestamp)}
      </Text>
    )
  }
];

export function ServicesPage() {
  const { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload } =
    useEditManifestDrawer<Service>("Service", updateService, "services");

  return (
    <>
      <ManifestDrawer
        opened={editDrawerOpened}
        onClose={closeEditDrawer}
        kind="Service"
        initialPayload={editInitialPayload}
        onApply={handleEditApply}
      />

      <ResourceListPage<Service>
        kind="Service"
        pluralTitle="Services"
        useList={useServices}
        useDelete={useDeleteService}
        columns={columns}
        onEditItem={handleEditItem}
      />
    </>
  );
}
