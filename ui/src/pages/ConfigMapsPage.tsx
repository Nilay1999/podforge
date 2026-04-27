import { useState } from "react";
import { Badge, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  ResourceListPage,
  formatAge,
  type Column,
} from "@src/components/common/ResourceListPage";
import { useConfigMaps, useDeleteConfigMap } from "@src/hooks/useConfigMaps";
import { updateConfigMap } from "@src/api/configmaps";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import {
  KIND_STRATEGIES,
  type AnyPayload,
} from "@src/components/manifest/kindStrategies";
import type { ConfigMap, CreateConfigMapRequest } from "@src/types";

const columns: Column<ConfigMap>[] = [
  {
    header: "Name",
    render: (c) => (
      <Text size="sm" ff="monospace" fw={500}>
        {c.metadata.name}
      </Text>
    ),
  },
  {
    header: "Data keys",
    render: (c) => (
      <Text size="sm" ff="monospace">
        {Object.keys(c.data ?? {}).length}
      </Text>
    ),
  },
  {
    header: "Binary keys",
    render: (c) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {Object.keys(c.binaryData ?? {}).length}
      </Text>
    ),
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
      ),
  },
  {
    header: "Age",
    render: (c) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(c.metadata.creationTimestamp)}
      </Text>
    ),
  },
];

export function ConfigMapsPage() {
  const qc = useQueryClient();
  const [editingConfigMap, setEditingConfigMap] = useState<ConfigMap | null>(
    null,
  );
  const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] =
    useDisclosure(false);

  const handleEditItem = (c: ConfigMap) => {
    setEditingConfigMap(c);
    openEditDrawer();
  };

  const handleEditApply = (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void },
  ) => {
    if (!editingConfigMap) return;
    const { namespace = "default", name } = editingConfigMap.metadata;
    updateConfigMap(namespace, name, payload as CreateConfigMapRequest)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["configmaps"] });
        opts.onSuccess();
      })
      .catch(opts.onError);
  };

  const editInitialPayload = editingConfigMap
    ? (KIND_STRATEGIES["ConfigMap"].fromManifest(
        editingConfigMap,
      ) as CreateConfigMapRequest)
    : undefined;

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
