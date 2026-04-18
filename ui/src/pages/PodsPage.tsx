import { useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Kbd,
  Loader,
  Menu,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconDots,
  IconEdit,
  IconInfoCircle,
  IconRefresh,
  IconSearch,
  IconTerminal,
  IconTrash,
} from "@tabler/icons-react";
import { ManifestDrawer } from "../components/manifest/ManifestDrawer";
import { PodDetailDrawer } from "../components/pods/PodDetailDrawer";
import { useDeletePod, usePods } from "../hooks/usePods";
import type { Pod } from "../types";

const NAMESPACES = [
  "default",
  "kube-system",
  "kube-public",
  "production",
  "staging",
  "monitoring",
];

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

function podAge(creationTimestamp?: string): string {
  if (!creationTimestamp) return "–";
  const seconds = Math.floor(
    (Date.now() - new Date(creationTimestamp).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function rowTint(phase?: string): string | undefined {
  if (phase === "Pending") return "var(--mantine-color-warning-0)";
  if (phase === "Failed" || phase === "CrashLoopBackOff")
    return "var(--mantine-color-danger-0)";
  return undefined;
}

type Filter = "all" | "running" | "pending" | "failed";

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}

function FilterChip({ label, count, active, color, onClick }: FilterChipProps) {
  const colorMap: Record<string, { bg: string; fg: string; bd: string }> = {
    gray: {
      bg: "var(--mantine-color-default-hover)",
      fg: "var(--mantine-color-dimmed)",
      bd: "transparent",
    },
    success: {
      bg: "var(--mantine-color-success-0)",
      fg: "var(--mantine-color-success-8)",
      bd: "var(--mantine-color-success-1)",
    },
    warning: {
      bg: "var(--mantine-color-warning-0)",
      fg: "var(--mantine-color-warning-8)",
      bd: "var(--mantine-color-warning-1)",
    },
    danger: {
      bg: "var(--mantine-color-danger-0)",
      fg: "var(--mantine-color-danger-8)",
      bd: "var(--mantine-color-danger-1)",
    },
    primary: {
      bg: "var(--mantine-color-steelBlue-0)",
      fg: "var(--mantine-color-steelBlue-8)",
      bd: "var(--mantine-color-steelBlue-1)",
    },
  };
  const key = active ? color : "gray";
  const c = colorMap[key] ?? colorMap.gray!;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 500,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
      }}
    >
      {label} · {count}
    </button>
  );
}

export function PodsPage() {
  const [namespace, setNamespace] = useState("default");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activePod, setActivePod] = useState<Pod | null>(null);

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

  const allPods = data?.items ?? [];

  const counts = useMemo(
    () => ({
      all: allPods.length,
      running: allPods.filter((p) => p.status?.phase === "Running").length,
      pending: allPods.filter((p) => p.status?.phase === "Pending").length,
      failed: allPods.filter(
        (p) =>
          p.status?.phase === "Failed" ||
          (p.status?.phase as string) === "CrashLoopBackOff"
      ).length,
    }),
    [allPods]
  );

  const filtered = useMemo(() => {
    return allPods.filter((p) => {
      const name = p.metadata.name;
      if (search && !name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filter === "running" && p.status?.phase !== "Running") return false;
      if (filter === "pending" && p.status?.phase !== "Pending") return false;
      if (
        filter === "failed" &&
        p.status?.phase !== "Failed" &&
        (p.status?.phase as string) !== "CrashLoopBackOff"
      )
        return false;
      return true;
    });
  }, [allPods, search, filter]);

  const toggleSelect = (name: string) => {
    const s = new Set(selected);
    if (s.has(name)) s.delete(name);
    else s.add(name);
    setSelected(s);
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0;

  return (
    <>
      <ManifestDrawer opened={drawerOpened} onClose={closeDrawer} kind="Pod" />
      <PodDetailDrawer pod={activePod} onClose={() => setActivePod(null)} />

      <Stack gap="md">
        {/* Page header */}
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>Pods</Title>
            <Badge color="steelBlue" variant="light" size="md">
              {filtered.length}
              {filtered.length !== allPods.length && ` / ${allPods.length}`}
            </Badge>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Press <Kbd size="xs">N</Kbd> to create
            </Text>
            <Button leftSection={<IconSearch size={14} />} onClick={openDrawer}>
              Create Pod
            </Button>
          </Group>
        </Group>

        {/* Filter bar */}
        <Group gap="xs" align="flex-end" wrap="wrap">
          <Select
            label="Namespace"
            value={namespace}
            onChange={(v) => v && setNamespace(v)}
            data={NAMESPACES}
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
            style={{ flex: 1, minWidth: 180 }}
          />
          <ActionIcon
            variant="default"
            size="lg"
            onClick={() => refetch()}
            loading={isFetching}
            title="Refresh"
            style={{ marginBottom: 1 }}
          >
            <IconRefresh size={16} />
          </ActionIcon>
          <Box style={{ flex: 1 }} />
          <Group gap="xs">
            <FilterChip
              label="All"
              count={counts.all}
              color="primary"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterChip
              label="Running"
              count={counts.running}
              color="success"
              active={filter === "running"}
              onClick={() => setFilter("running")}
            />
            <FilterChip
              label="Pending"
              count={counts.pending}
              color="warning"
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
            />
            <FilterChip
              label="Failed"
              count={counts.failed}
              color="danger"
              active={filter === "failed"}
              onClick={() => setFilter("failed")}
            />
          </Group>
        </Group>

        {/* Bulk action bar */}
        {someSelected && (
          <Group
            gap="xs"
            px="sm"
            py="xs"
            style={{
              borderRadius: 8,
              background: "var(--mantine-color-steelBlue-0)",
              border: "1px solid var(--mantine-color-steelBlue-1)",
            }}
          >
            <Text size="sm" fw={500} c="steelBlue">
              {selected.size} selected
            </Text>
            <Box style={{ flex: 1 }} />
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              color="danger"
              size="xs"
              leftSection={<IconTrash size={12} />}
            >
              Delete selected
            </Button>
          </Group>
        )}

        {isLoading && <Loader />}

        {error && (
          <Alert color="red" title="Failed to load pods">
            {error.message}
          </Alert>
        )}

        {data && (
          <Paper withBorder radius="md" style={{ overflow: "hidden" }} p={0}>
            <Table highlightOnHover style={{ fontSize: 13 }}>
              <Table.Thead
                style={{ background: "var(--mantine-color-default-hover)" }}
              >
                <Table.Tr>
                  <Table.Th style={{ width: 36 }}>
                    <Checkbox
                      size="xs"
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected
                            ? new Set()
                            : new Set(filtered.map((p) => p.metadata.name))
                        )
                      }
                    />
                  </Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Ready</Table.Th>
                  <Table.Th>Restarts</Table.Th>
                  <Table.Th>Node</Table.Th>
                  <Table.Th>Pod IP</Table.Th>
                  <Table.Th>Age</Table.Th>
                  <Table.Th style={{ width: 44 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((pod) => {
                  const containerStatuses = pod.status?.containerStatuses ?? [];
                  const readyCount = containerStatuses.filter((c) => c.ready).length;
                  const totalContainers =
                    pod.spec?.containers?.length ??
                    containerStatuses.length;
                  const restarts = containerStatuses.reduce(
                    (s, c) => s + c.restartCount,
                    0
                  );
                  const age = podAge(pod.metadata.creationTimestamp);
                  const tint = rowTint(pod.status?.phase);

                  return (
                    <Table.Tr
                      key={pod.metadata.name}
                      onClick={() => setActivePod(pod)}
                      style={{
                        background: tint,
                        cursor: "pointer",
                      }}
                    >
                      <Table.Td
                        onClick={(e) => e.stopPropagation()}
                        style={{ verticalAlign: "middle" }}
                      >
                        <Checkbox
                          size="xs"
                          checked={selected.has(pod.metadata.name)}
                          onChange={() => toggleSelect(pod.metadata.name)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" fw={500}>
                          {pod.metadata.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={phaseColor(pod.status?.phase)}
                          variant="light"
                          size="sm"
                        >
                          {pod.status?.phase ?? "Unknown"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace">
                          {totalContainers > 0
                            ? `${readyCount}/${totalContainers}`
                            : "–"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          ff="monospace"
                          c={restarts > 0 ? "warning" : "dimmed"}
                        >
                          {restarts}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {pod.spec?.nodeName ?? "–"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {pod.status?.podIP ?? "–"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {age}
                        </Text>
                      </Table.Td>
                      <Table.Td onClick={(e) => e.stopPropagation()}>
                        <Menu shadow="md" width={180} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconInfoCircle size={14} />}
                              onClick={() => setActivePod(pod)}
                            >
                              View details
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTerminal size={14} />}>
                              View logs
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTerminal size={14} />}>
                              Exec shell
                            </Menu.Item>
                            <Menu.Item leftSection={<IconEdit size={14} />}>
                              Edit manifest
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDelete(pod.metadata.name)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                      <Text c="dimmed" size="sm">
                        {search
                          ? `No pods match "${search}" in `
                          : `No pods in namespace `}
                        <Text span ff="monospace">{namespace}</Text>
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
