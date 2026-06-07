import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import { IconPlayerPause, IconPlayerPlay, IconSearch, IconTrash } from "@tabler/icons-react";
import { useClusterEvents } from "@src/hooks/useClusterEvents";
import { eventTimestamp, type ClusterEvent, type EventSeverity } from "@src/types";
import { DEFAULT_NAMESPACES } from "@src/utils/constants";
import { formatAge } from "@src/components/common/ResourceListPage";

const ALL_NAMESPACES = "__all__";

type TypeFilter = "all" | EventSeverity;

function severityColor(type?: EventSeverity): string {
  if (type === "Warning") return "red";
  return "gray";
}

function involvedLabel(e: ClusterEvent): string {
  const obj = e.involvedObject;
  if (!obj?.kind) return "–";
  return obj.name ? `${obj.kind}/${obj.name}` : obj.kind;
}

export function EventsPage() {
  const [namespaceValue, setNamespaceValue] = useState(ALL_NAMESPACES);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);

  const namespace = namespaceValue === ALL_NAMESPACES ? "" : namespaceValue;
  const { events, connected, clear } = useClusterEvents(namespace, paused);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!q) return true;
      return (
        e.reason?.toLowerCase().includes(q) ||
        e.message?.toLowerCase().includes(q) ||
        involvedLabel(e).toLowerCase().includes(q) ||
        e.metadata.namespace?.toLowerCase().includes(q)
      );
    });
  }, [events, typeFilter, search]);

  const warningCount = useMemo(() => events.filter((e) => e.type === "Warning").length, [events]);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <Title order={2}>Events</Title>
          <Badge color="steelBlue" variant="light">
            {filtered.length}
            {filtered.length !== events.length && ` / ${events.length}`}
          </Badge>
          {warningCount > 0 && (
            <Badge color="red" variant="light">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </Group>
        <Tooltip
          label={connected ? "Receiving live events" : "Connecting to event stream…"}
          withArrow
        >
          <Badge color={connected ? "teal" : "gray"} variant="dot" style={{ cursor: "default" }}>
            {connected ? "Live" : "Connecting"}
          </Badge>
        </Tooltip>
      </Group>

      <Group gap="xs" align="flex-end" wrap="wrap">
        <Select
          label="Namespace"
          value={namespaceValue}
          onChange={(v) => v && setNamespaceValue(v)}
          data={[{ value: ALL_NAMESPACES, label: "All namespaces" }, ...DEFAULT_NAMESPACES]}
          size="xs"
          style={{ minWidth: 160 }}
        />
        <SegmentedControl
          size="xs"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          data={[
            { value: "all", label: "All" },
            { value: "Warning", label: "Warnings" },
            { value: "Normal", label: "Normal" }
          ]}
          style={{ marginBottom: 1 }}
        />
        <TextInput
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Filter by reason, message, object…"
          leftSection={<IconSearch size={14} />}
          size="xs"
          style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
        />
        <Tooltip label={paused ? "Resume stream" : "Pause stream"} withArrow>
          <ActionIcon
            variant="default"
            size="md"
            onClick={() => setPaused((p) => !p)}
            style={{ marginBottom: 1 }}
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Clear events" withArrow>
          <ActionIcon
            variant="default"
            size="md"
            onClick={clear}
            style={{ marginBottom: 1 }}
            aria-label="Clear"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Paper withBorder radius="md" style={{ overflow: "hidden" }} p={0}>
        <Table highlightOnHover style={{ fontSize: 13 }}>
          <Table.Thead style={{ background: "var(--mantine-color-default-hover)" }}>
            <Table.Tr>
              <Table.Th style={{ width: 90 }}>Type</Table.Th>
              <Table.Th style={{ width: 160 }}>Reason</Table.Th>
              <Table.Th style={{ width: 200 }}>Object</Table.Th>
              <Table.Th>Message</Table.Th>
              <Table.Th style={{ width: 60 }}>Count</Table.Th>
              <Table.Th style={{ width: 80 }}>Last Seen</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((e) => (
              <Table.Tr key={e.metadata.uid}>
                <Table.Td>
                  <Badge color={severityColor(e.type)} variant="light" size="sm">
                    {e.type ?? "Unknown"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="monospace" fw={500}>
                    {e.reason ?? "–"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" ff="monospace">
                      {involvedLabel(e)}
                    </Text>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {e.metadata.namespace || e.involvedObject?.namespace || "cluster"}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{e.message ?? "–"}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="monospace" c="dimmed">
                    {e.count ?? 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="monospace" c="dimmed">
                    {formatAge(eventTimestamp(e))}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                  <Text c="dimmed" size="sm">
                    {events.length === 0
                      ? "Waiting for cluster events…"
                      : `No events match the current filters`}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
