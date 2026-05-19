import { useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDots, IconPlus, IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";
import { useNamespaces, useCreateNamespace, useDeleteNamespace } from "@src/hooks/useNamespaces";
import type { CreateNamespaceRequest } from "@src/types";
import { formatAge } from "@src/components/common/ResourceListPage";

export function NamespacesPage() {
  const [search, setSearch] = useState("");
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const { data, isLoading, error, refetch, isFetching } = useNamespaces();
  const createNs = useCreateNamespace();
  const deleteNs = useDeleteNamespace();

  const form = useForm<CreateNamespaceRequest>({
    initialValues: { name: "" },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (values.name && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(values.name))
        errors.name = "Must be lowercase alphanumeric, may contain hyphens";
      return errors;
    }
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((ns) => ns.metadata.name.toLowerCase().includes(q));
  }, [items, search]);

  const handleCreate = (values: CreateNamespaceRequest) => {
    createNs.mutate(values, {
      onSuccess: () => {
        notifications.show({ title: "Namespace created", message: values.name, color: "teal" });
        form.reset();
        closeModal();
      },
      onError: (err) =>
        notifications.show({ title: "Create failed", message: err.message, color: "red" })
    });
  };

  const handleDelete = (name: string) => {
    deleteNs.mutate(name, {
      onSuccess: () =>
        notifications.show({ title: "Namespace deleted", message: name, color: "teal" }),
      onError: (err) =>
        notifications.show({ title: "Delete failed", message: err.message, color: "red" })
    });
  };

  return (
    <>
      <Modal opened={modalOpened} onClose={closeModal} title="Create Namespace" size="sm">
        <Box component="form" onSubmit={form.onSubmit(handleCreate)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="my-namespace"
              withAsterisk
              {...form.getInputProps("name")}
            />
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={closeModal} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={createNs.isPending}>
                Create
              </Button>
            </Group>
          </Stack>
        </Box>
      </Modal>

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>Namespaces</Title>
            <Badge color="steelBlue" variant="light">
              {filtered.length}
              {filtered.length !== items.length && ` / ${items.length}`}
            </Badge>
          </Group>
          <Button leftSection={<IconPlus size={14} />} size="sm" onClick={openModal}>
            Create Namespace
          </Button>
        </Group>

        <Group gap="xs" align="flex-end">
          <TextInput
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Filter by name…"
            leftSection={<IconSearch size={14} />}
            size="xs"
            style={{ flex: 1, minWidth: 180, maxWidth: 300 }}
          />
          <ActionIcon
            variant="default"
            size="md"
            onClick={() => refetch()}
            loading={isFetching}
            title="Refresh"
            style={{ marginBottom: 1 }}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        {isLoading && <Loader />}

        {error && (
          <Alert color="red" title="Failed to load namespaces">
            {error.message}
          </Alert>
        )}

        {data && (
          <Paper withBorder radius="md" style={{ overflow: "hidden" }} p={0}>
            <Table highlightOnHover style={{ fontSize: 13 }}>
              <Table.Thead style={{ background: "var(--mantine-color-default-hover)" }}>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Labels</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Age</Table.Th>
                  <Table.Th style={{ width: 44 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((ns) => (
                  <Table.Tr key={ns.metadata.name}>
                    <Table.Td>
                      <Text size="sm" ff="monospace" fw={500}>
                        {ns.metadata.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace" c="dimmed">
                        {Object.keys(ns.metadata.labels ?? {}).length}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={ns.status?.phase === "Active" ? "teal" : "orange"}
                        variant="light"
                        size="sm"
                      >
                        {ns.status?.phase ?? "Unknown"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace" c="dimmed">
                        {formatAge(ns.metadata.creationTimestamp)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={160} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDelete(ns.metadata.name)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                      <Text c="dimmed" size="sm">
                        {search ? `No namespaces match "${search}"` : "No namespaces found"}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </>
  );
}
