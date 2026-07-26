import { useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { useNodes } from "@src/hooks/useNodes";
import { NodeDetailDrawer } from "@src/components/nodes/NodeDetailDrawer";
import { formatMemory, isNodeReady, nodeInternalIP, nodeRoles } from "@src/components/nodes/nodeUtils";
import { formatAge } from "@src/components/common/ResourceListPage";

export function NodesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useNodes();

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((n) => n.metadata.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <>
      <NodeDetailDrawer nodeName={selected} onClose={() => setSelected(null)} />

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>Nodes</Title>
            <Badge color="steelBlue" variant="light">
              {filtered.length}
              {filtered.length !== items.length && ` / ${items.length}`}
            </Badge>
          </Group>
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
          <Alert color="danger" title="Failed to load nodes">
            {error.message}
          </Alert>
        )}

        {data && (
          <Paper withBorder radius="md" style={{ overflow: "hidden" }} p={0}>
            <Table highlightOnHover style={{ fontSize: 13 }}>
              <Table.Thead style={{ background: "var(--mantine-color-default-hover)" }}>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Roles</Table.Th>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Internal IP</Table.Th>
                  <Table.Th>CPU</Table.Th>
                  <Table.Th>Memory</Table.Th>
                  <Table.Th>Age</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((n) => {
                  const ready = isNodeReady(n);
                  return (
                    <Table.Tr
                      key={n.metadata.name}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(n.metadata.name)}
                    >
                      <Table.Td>
                        <Text size="sm" ff="monospace" fw={500}>
                          {n.metadata.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Badge color={ready ? "success" : "danger"} variant="light" size="sm">
                            {ready ? "Ready" : "NotReady"}
                          </Badge>
                          {n.spec?.unschedulable && (
                            <Badge color="warning" variant="light" size="sm">
                              SchedulingDisabled
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {nodeRoles(n).join(", ")}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {n.status?.nodeInfo?.kubeletVersion ?? "–"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {nodeInternalIP(n)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {n.status?.capacity?.cpu ?? "–"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {formatMemory(n.status?.capacity?.memory)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {formatAge(n.metadata.creationTimestamp)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                      <Text c="dimmed" size="sm">
                        {search ? `No nodes match "${search}"` : "No nodes found"}
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
