import { useMemo, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconDots,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash
} from "@tabler/icons-react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { MutationResponse, ObjectMeta, ResourceKind } from "@src/types";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import { DEFAULT_NAMESPACES } from "@src/utils/constants";
import { useWatchResource } from "@src/hooks/useWatchResource";

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  width?: number | string;
}

interface ListShape<T> {
  items: T[];
}

interface ResourceListPageProps<T extends { metadata: ObjectMeta }> {
  kind: ResourceKind;
  pluralTitle: string;
  useList: (namespace: string) => UseQueryResult<ListShape<T>, Error>;
  useDelete: (namespace: string) => UseMutationResult<MutationResponse, Error, string>;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  onEditItem?: (item: T) => void;
}

export function formatAge(creationTimestamp?: string): string {
  if (!creationTimestamp) return "–";
  const seconds = Math.floor((Date.now() - new Date(creationTimestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function ResourceListPage<T extends { metadata: ObjectMeta }>({
  kind,
  pluralTitle,
  useList,
  useDelete,
  columns,
  onRowClick,
  onEditItem
}: ResourceListPageProps<T>) {
  const [namespace, setNamespace] = useState("default");
  const [search, setSearch] = useState("");
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  // "Pod" → "pods", "ConfigMap" → "configmaps" — matches the key used in createResourceHooks
  const resource = kind.toLowerCase() + "s";
  const { connected } = useWatchResource(resource, namespace);

  const { data, isLoading, error, refetch, isFetching } = useList(namespace);
  const deleteMutation = useDelete(namespace);

  const allItems = data?.items ?? [];

  const filtered = useMemo(() => {
    if (!search) return allItems;
    const q = search.toLowerCase();
    return allItems.filter((item) => item.metadata.name.toLowerCase().includes(q));
  }, [allItems, search]);

  const handleDelete = (name: string) => {
    deleteMutation.mutate(name, {
      onSuccess: () =>
        notifications.show({
          title: `${kind} deleted`,
          message: `${name} removed from ${namespace}`,
          color: "teal"
        }),
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
      <ManifestDrawer opened={drawerOpened} onClose={closeDrawer} kind={kind} />

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>{pluralTitle}</Title>
            <Badge color="steelBlue" variant="light">
              {filtered.length}
              {filtered.length !== allItems.length && ` / ${allItems.length}`}
            </Badge>
          </Group>
          <Button leftSection={<IconPlus size={14} />} size="sm" onClick={openDrawer}>
            Create {kind}
          </Button>
        </Group>

        <Group gap="xs" align="flex-end" wrap="wrap">
          <Select
            label="Namespace"
            value={namespace}
            onChange={(v) => v && setNamespace(v)}
            data={DEFAULT_NAMESPACES}
            size="xs"
            style={{ minWidth: 140 }}
          />
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
          <Tooltip
            label={connected ? "Receiving live updates" : "Connecting to live stream…"}
            withArrow
          >
            <Badge
              color={connected ? "teal" : "gray"}
              variant="dot"
              size="sm"
              style={{ marginBottom: 1, cursor: "default" }}
            >
              {connected ? "Live" : "Connecting"}
            </Badge>
          </Tooltip>
        </Group>

        {isLoading && <Loader />}

        {error && (
          <Alert color="red" title={`Failed to load ${pluralTitle.toLowerCase()}`}>
            {error.message}
          </Alert>
        )}

        {data && (
          <Paper withBorder radius="md" style={{ overflow: "hidden" }} p={0}>
            <Table highlightOnHover style={{ fontSize: 13 }}>
              <Table.Thead style={{ background: "var(--mantine-color-default-hover)" }}>
                <Table.Tr>
                  {columns.map((col) => (
                    <Table.Th key={col.header} style={col.width ? { width: col.width } : undefined}>
                      {col.header}
                    </Table.Th>
                  ))}
                  <Table.Th style={{ width: 44 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((item) => (
                  <Table.Tr
                    key={item.metadata.name}
                    onClick={() => onRowClick?.(item)}
                    style={{ cursor: onRowClick ? "pointer" : undefined }}
                  >
                    {columns.map((col) => (
                      <Table.Td key={col.header}>{col.render(item)}</Table.Td>
                    ))}
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Menu shadow="md" width={160} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => onEditItem?.(item)}
                            disabled={!onEditItem}
                          >
                            Edit manifest
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDelete(item.metadata.name)}
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
                    <Table.Td
                      colSpan={columns.length + 1}
                      style={{ textAlign: "center", padding: 40 }}
                    >
                      <Text c="dimmed" size="sm">
                        {search
                          ? `No ${pluralTitle.toLowerCase()} match "${search}" in `
                          : `No ${pluralTitle.toLowerCase()} in namespace `}
                        <Text span ff="monospace">
                          {namespace}
                        </Text>
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
