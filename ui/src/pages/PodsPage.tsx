import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Group,
  Loader,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconRefresh, IconTrash } from "@tabler/icons-react";
import { ResourcePageHeader } from "../components/common/ResourcePageHeader";
import { ManifestDrawer } from "../components/manifest/ManifestDrawer";
import { useDeletePod, usePods } from "../hooks/usePods";

const phaseColor = (phase?: string) => {
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
};

export function PodsPage() {
  const [namespace, setNamespace] = useState("default");
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const { data, isLoading, error, refetch, isFetching } = usePods(namespace);
  const deleteMutation = useDeletePod(namespace);

  const handleDelete = (name: string) => {
    deleteMutation.mutate(name, {
      onSuccess: () =>
        notifications.show({
          title: "Pod deleted",
          message: `${name} removed from ${namespace}`,
          color: "teal",
        }),
      onError: (err) =>
        notifications.show({
          title: "Delete failed",
          message: err.message,
          color: "red",
        }),
    });
  };

  return (
    <Stack>
      <ResourcePageHeader title="Pod" onCreateClick={openDrawer} />

      <ManifestDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        kind="Pod"
      />

      <Group>
        <TextInput
          label="Namespace"
          value={namespace}
          onChange={(e) => setNamespace(e.currentTarget.value)}
          size="xs"
        />
        <ActionIcon
          variant="light"
          onClick={() => refetch()}
          loading={isFetching}
          size="lg"
          mt="lg"
        >
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>

      {isLoading && <Loader />}

      {error && (
        <Alert color="red" title="Failed to load pods">
          {error.message}
        </Alert>
      )}

      {data && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Node</Table.Th>
              <Table.Th>Pod IP</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.items.map((pod) => (
              <Table.Tr key={pod.metadata.name}>
                <Table.Td>{pod.metadata.name}</Table.Td>
                <Table.Td>
                  <Badge color={phaseColor(pod.status?.phase)} variant="light">
                    {pod.status?.phase ?? "Unknown"}
                  </Badge>
                </Table.Td>
                <Table.Td>{pod.spec?.nodeName ?? "-"}</Table.Td>
                <Table.Td>{pod.status?.podIP ?? "-"}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => handleDelete(pod.metadata.name)}
                    loading={
                      deleteMutation.isPending &&
                      deleteMutation.variables === pod.metadata.name
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: "center" }}>
                  No pods in namespace "{namespace}"
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
