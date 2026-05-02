import { Badge, Text } from "@mantine/core";
import { ResourceListPage, formatAge, type Column } from "@src/components/common/ResourceListPage";
import { useConfigMaps, useDeleteConfigMap } from "@src/hooks/useConfigMaps";
import { updateConfigMap } from "@src/api/configmaps";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import { useEditManifestDrawer } from "@src/hooks/useEditManifestDrawer";
import type { ConfigMap } from "@src/types";

const columns: Column<ConfigMap>[] = [
  {
    header: "Name",
    render: (c) => (
      <Text size="sm" ff="monospace" fw={500}>
        {c.metadata.name}
      </Text>
    )
  },
  {
    header: "Data keys",
    render: (c) => (
      <Text size="sm" ff="monospace">
        {Object.keys(c.data ?? {}).length}
      </Text>
    )
  },
  {
    header: "Binary keys",
    render: (c) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {Object.keys(c.binaryData ?? {}).length}
      </Text>
    )
  },
  {
    header: "Immutable",
    render: (c) =>
      c.immutable ? (
        <Badge color="steelBlue" variant="light" size="sm">
          Yes
        </Badge>
      ) : (
        <Text size="sm" c="dimmed">
          No
        </Text>
      )
  },
  {
    header: "Age",
    render: (c) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(c.metadata.creationTimestamp)}
      </Text>
    )
  }
];

export function ConfigMapsPage() {
  const { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload } =
    useEditManifestDrawer<ConfigMap>("ConfigMap", updateConfigMap, "configmaps");

  return (
    <>
      <ManifestDrawer
        opened={editDrawerOpened}
        onClose={closeEditDrawer}
        kind="ConfigMap"
        initialPayload={editInitialPayload}
        onApply={handleEditApply}
      />

      <ResourceListPage<ConfigMap>
        kind="ConfigMap"
        pluralTitle="ConfigMaps"
        useList={useConfigMaps}
        useDelete={useDeleteConfigMap}
        columns={columns}
        onEditItem={handleEditItem}
      />
    </>
  );
}
