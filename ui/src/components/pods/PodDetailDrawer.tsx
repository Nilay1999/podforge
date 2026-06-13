import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput
} from "@mantine/core";
import {
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconCode,
  IconDownload,
  IconEdit,
  IconInfoCircle,
  IconSearch,
  IconTerminal,
  IconTrash,
  IconX
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import jsYaml from "js-yaml";
import type { Pod } from "@src/types";
import { getPodOverview } from "@src/api/pods";
import { sseUrl } from "@src/auth/token";

function phaseColor(phase?: string) {
  if (phase === "Running") return "success";
  if (phase === "Pending") return "warning";
  if (phase === "Failed" || phase === "CrashLoopBackOff") return "danger";
  return "gray";
}

function podAge(creationTimestamp?: string): string {
  if (!creationTimestamp) return "–";
  const seconds = Math.floor((Date.now() - new Date(creationTimestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

interface PodDetailDrawerProps {
  pod: Pod | null;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function PodDetailDrawer({ pod, onClose, onDelete, onEdit }: PodDetailDrawerProps) {
  const [tab, setTab] = useState<string | null>("overview");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [follow, setFollow] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState("");
  const [tailLines, setTailLines] = useState("200");
  const [showPrevious, setShowPrevious] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const logScrollRef = useRef<HTMLDivElement>(null);

  const phase = pod?.status?.phase;
  const containerStatuses = pod?.status?.containerStatuses ?? [];
  const readyCount = containerStatuses.filter((c) => c.ready).length;
  const totalContainers = containerStatuses.length;
  const restarts = containerStatuses.reduce((s, c) => s + c.restartCount, 0);
  const age = podAge(pod?.metadata.creationTimestamp);
  const podName = pod?.metadata.name;
  const podNamespace = pod?.metadata.namespace;
  const containers = pod?.spec?.containers?.map((c) => c.name) ?? [];
  const firstContainer = pod?.spec?.containers?.[0]?.name ?? "";

  useEffect(() => {
    setSelectedContainer(firstContainer);
  }, [firstContainer]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["pod-overview", podNamespace, podName],
    queryFn: () => getPodOverview(pod!.metadata.namespace!, pod!.metadata.name),
    enabled: !!pod,
    staleTime: 30_000
  });

  useEffect(() => {
    if (!podName || tab !== "logs") return;

    const ns = podNamespace ?? "default";
    setLogLines([]);

    const params = new URLSearchParams();
    if (follow) params.set("follow", "true");
    if (tailLines !== "all") params.set("tail", tailLines);
    if (selectedContainer) params.set("container", selectedContainer);
    if (showPrevious) params.set("previous", "true");

    const es = new EventSource(sseUrl(`/api/v1/pod/${ns}/${podName}/logs/stream?${params}`));
    es.addEventListener("log", (e: MessageEvent) => {
      setLogLines((prev) => [...prev.slice(-1999), e.data]);
    });
    es.onerror = () => es.close();

    return () => es.close();
  }, [tab, podNamespace, podName, follow, selectedContainer, tailLines, showPrevious]);

  useEffect(() => {
    if (follow && logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logLines, follow]);

  const filteredLines = useMemo(
    () =>
      logFilter
        ? logLines.filter((l) => l.toLowerCase().includes(logFilter.toLowerCase()))
        : logLines,
    [logLines, logFilter]
  );

  const handleDownload = () => {
    const blob = new Blob([logLines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pod?.metadata.name ?? "pod"}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const specYaml = pod
    ? jsYaml.dump(
        {
          apiVersion: "v1",
          kind: "Pod",
          metadata: pod.metadata,
          spec: pod.spec,
          status: pod.status
        },
        { lineWidth: -1 }
      )
    : "";

  const conditions = overview?.conditions ?? pod?.status?.conditions ?? [];
  const events = overview?.events ?? [];
  const labels = pod?.metadata.labels ?? {};

  return (
    <Drawer
      opened={!!pod}
      onClose={onClose}
      position="right"
      size={760}
      withCloseButton={false}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: 0
        },
        content: { display: "flex", flexDirection: "column" }
      }}
    >
      <Box
        px="lg"
        py="md"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
          background: "var(--mantine-color-default-hover)"
        }}
      >
        <Group gap="xs" mb={8}>
          <Text fw={600} size="md" ff="monospace" style={{ flex: 1, wordBreak: "break-all" }}>
            {pod?.metadata.name}
          </Text>
          <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close">
            <IconX size={16} />
          </ActionIcon>
        </Group>
        <Group gap="xs" wrap="wrap">
          <Badge color={phaseColor(phase)} variant="light">
            {phase ?? "Unknown"}
          </Badge>
          <Text size="xs" c="dimmed">
            {pod?.metadata.namespace ?? "default"} · {age}
            {restarts > 0 && ` · ${restarts} restart${restarts !== 1 ? "s" : ""}`}
          </Text>
          <Box style={{ flex: 1 }} />
          <Button
            variant="default"
            size="xs"
            leftSection={<IconCode size={12} />}
            onClick={() => setTab("logs")}
          >
            Logs
          </Button>
          <Button
            variant="default"
            size="xs"
            leftSection={<IconEdit size={12} />}
            onClick={onEdit}
            disabled={!onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            color="red"
            size="xs"
            leftSection={<IconTrash size={12} />}
            onClick={onDelete}
            disabled={!onDelete}
          >
            Delete
          </Button>
        </Group>
      </Box>

      <Tabs
        value={tab}
        onChange={setTab}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        styles={{ panel: { flex: 1, overflowY: "auto" } }}
      >
        <Tabs.List px="lg">
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={13} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="spec" leftSection={<IconCode size={13} />}>
            Spec
          </Tabs.Tab>
          <Tabs.Tab value="events" leftSection={<IconActivity size={13} />}>
            Events
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<IconTerminal size={13} />}>
            Logs
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" p="lg">
          <Stack gap="lg">
            <section>
              <Text
                size="xs"
                fw={700}
                tt="uppercase"
                c="dimmed"
                style={{ letterSpacing: "0.06em" }}
                mb="sm"
              >
                Metadata
              </Text>
              <Box
                component="dl"
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  rowGap: 8,
                  columnGap: 12,
                  margin: 0,
                  fontSize: 13
                }}
              >
                {[
                  ["Namespace", pod?.metadata.namespace ?? "default"],
                  ["Node", pod?.spec?.nodeName ?? "–"],
                  ["Pod IP", pod?.status?.podIP ?? "–"],
                  ["Image", pod?.spec?.containers?.[0]?.image ?? "–"],
                  ["Containers", totalContainers > 0 ? `${readyCount}/${totalContainers}` : "–"],
                  ["Age", age]
                ].map(([label, value]) => (
                  <>
                    <Text component="dt" size="sm" c="dimmed" key={`dt-${label}`}>
                      {label}
                    </Text>
                    <Text
                      component="dd"
                      size="sm"
                      ff="monospace"
                      style={{ margin: 0 }}
                      key={`dd-${label}`}
                    >
                      {value}
                    </Text>
                  </>
                ))}
              </Box>
            </section>

            {Object.keys(labels).length > 0 && (
              <section>
                <Text
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  c="dimmed"
                  style={{ letterSpacing: "0.06em" }}
                  mb="sm"
                >
                  Labels
                </Text>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(labels).map(([k, v]) => (
                    <Badge key={k} color="gray" variant="light" radius="sm">
                      <Text span ff="monospace" size="xs">
                        {k}={v}
                      </Text>
                    </Badge>
                  ))}
                </Group>
              </section>
            )}

            <section>
              <Text
                size="xs"
                fw={700}
                tt="uppercase"
                c="dimmed"
                style={{ letterSpacing: "0.06em" }}
                mb="sm"
              >
                Conditions
              </Text>
              {overviewLoading ? (
                <Loader size="xs" />
              ) : conditions.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No conditions reported
                </Text>
              ) : (
                <Stack gap="xs">
                  {conditions.map((cond) => (
                    <Group key={cond.type} gap="xs">
                      {cond.status === "True" ? (
                        <IconCheck size={14} color="var(--mantine-color-success-6)" />
                      ) : (
                        <IconAlertTriangle size={14} color="var(--mantine-color-warning-6)" />
                      )}
                      <Text size="sm" ff="monospace">
                        {cond.type}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {cond.status}
                      </Text>
                      {cond.reason && (
                        <Text size="sm" c="dimmed">
                          — {cond.reason}
                        </Text>
                      )}
                    </Group>
                  ))}
                </Stack>
              )}
            </section>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="spec" p="lg">
          <Box
            component="pre"
            style={{
              fontFamily: "var(--mantine-font-monospace, monospace)",
              fontSize: 13,
              margin: 0,
              padding: 14,
              borderRadius: 6,
              background: "var(--mantine-color-default-hover)",
              border: "1px solid var(--mantine-color-default-border)",
              lineHeight: 1.55,
              overflow: "auto"
            }}
          >
            {specYaml}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="events" p="lg">
          {overviewLoading ? (
            <Loader size="xs" />
          ) : events.length === 0 ? (
            <Text size="sm" c="dimmed">
              No events
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  {["Type", "Reason", "Message", "Count", "Last Seen"].map((h) => (
                    <Table.Th key={h}>{h}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {events.map((e, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Badge
                        size="xs"
                        color={e.type === "Normal" ? "gray" : "warning"}
                        variant="light"
                      >
                        {e.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {e.reason}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{e.message}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace" c="dimmed">
                        {e.count ?? 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" ff="monospace">
                        {e.lastTimestamp ? new Date(e.lastTimestamp).toLocaleTimeString() : "–"}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel
          value="logs"
          style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}
        >
          <Group
            px="sm"
            py="xs"
            gap="xs"
            wrap="nowrap"
            style={{
              borderBottom: "1px solid var(--mantine-color-default-border)",
              flexShrink: 0
            }}
          >
            {containers.length > 1 && (
              <Select
                size="xs"
                data={containers}
                value={selectedContainer}
                onChange={(v) => setSelectedContainer(v ?? "")}
                style={{ width: 130 }}
                comboboxProps={{ withinPortal: true }}
              />
            )}
            <Select
              size="xs"
              data={[
                { value: "50", label: "Tail 50" },
                { value: "200", label: "Tail 200" },
                { value: "1000", label: "Tail 1000" },
                { value: "all", label: "All lines" }
              ]}
              value={tailLines}
              onChange={(v) => setTailLines(v ?? "200")}
              style={{ width: 110 }}
              comboboxProps={{ withinPortal: true }}
            />
            <TextInput
              size="xs"
              placeholder="Filter..."
              leftSection={<IconSearch size={12} />}
              value={logFilter}
              onChange={(e) => setLogFilter(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Switch
              size="xs"
              label="Follow"
              checked={follow}
              onChange={(e) => setFollow(e.currentTarget.checked)}
            />
            <Switch
              size="xs"
              label="Prev"
              checked={showPrevious}
              onChange={(e) => setShowPrevious(e.currentTarget.checked)}
            />
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={handleDownload}
              disabled={logLines.length === 0}
              title="Download logs"
            >
              <IconDownload size={14} />
            </ActionIcon>
          </Group>

          {logLines.length === 0 ? (
            <Alert color="gray" variant="light" m="sm">
              Connecting to log stream…
            </Alert>
          ) : (
            <Box
              ref={logScrollRef}
              style={{
                background: "var(--mantine-color-dark-8, #0f0f11)",
                color: "var(--mantine-color-dark-0, #fafafa)",
                padding: 12,
                fontFamily: "var(--mantine-font-monospace, monospace)",
                fontSize: 12.5,
                lineHeight: 1.6,
                overflowY: "auto",
                flex: 1
              }}
            >
              {filteredLines.length === 0 ? (
                <Text c="dimmed" size="xs" ff="monospace">
                  No lines match &quot;{logFilter}&quot;
                </Text>
              ) : (
                filteredLines.map((line, i) => <div key={i}>{line}</div>)
              )}
              {!logFilter && <div style={{ color: "var(--mantine-color-success-5)" }}>▊</div>}
            </Box>
          )}
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  );
}
