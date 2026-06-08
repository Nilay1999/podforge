import { Badge, Text } from "@mantine/core";
import { ResourceListPage, formatAge, type Column } from "@src/components/common/ResourceListPage";
import { useSecrets, useDeleteSecret } from "@src/hooks/useSecrets";
import { updateSecret } from "@src/api/secrets";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import { useEditManifestDrawer } from "@src/hooks/useEditManifestDrawer";
import type { Secret } from "@src/types";

const columns: Column<Secret>[] = [
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
      <Text size="sm" ff="monospace" c="dimmed">
        {s.type ?? "Opaque"}
      </Text>
    )
  },
  {
    header: "Keys",
    render: (s) => (
      <Text size="sm" ff="monospace">
        {Object.keys(s.data ?? {}).length}
      </Text>
    )
  },
  {
    header: "Immutable",
    render: (s) =>
      s.immutable ? (
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
    render: (s) => (
      <Text size="sm" ff="monospace" c="dimmed">
        {formatAge(s.metadata.creationTimestamp)}
      </Text>
    )
  }
];

export function SecretsPage() {
  const { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload } =
    useEditManifestDrawer<Secret>("Secret", updateSecret, "secrets");

  return (
    <>
      <ManifestDrawer
        opened={editDrawerOpened}
        onClose={closeEditDrawer}
        kind="Secret"
        initialPayload={editInitialPayload}
        onApply={handleEditApply}
      />

      <ResourceListPage<Secret>
        kind="Secret"
        pluralTitle="Secrets"
        useList={useSecrets}
        useDelete={useDeleteSecret}
        columns={columns}
        onEditItem={handleEditItem}
      />
    </>
  );
}
