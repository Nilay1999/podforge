import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Stack,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import {
  IconActivity,
  IconCheck,
  IconAlertTriangle,
  IconCode,
  IconEdit,
  IconInfoCircle,
  IconTerminal,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import jsYaml from "js-yaml";
import type { Pod } from "../../types";

function phaseColor(phase?: string) {
  if (phase === "Running") return "success";
  if (phase === "Pending") return "warning";
  if (phase === "Failed" || phase === "CrashLoopBackOff") return "danger";
  return "gray";
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

const MOCK_EVENTS = [
  { type: "Normal", reason: "Started", msg: "Started container", t: "2m ago" },
  { type: "Normal", reason: "Created", msg: "Created container", t: "2m ago" },
  { type: "Normal", reason: "Pulled", msg: "Successfully pulled image", t: "2m ago" },
  { type: "Normal", reason: "Scheduled", msg: "Pod assigned to node", t: "2m ago" },
];

const MOCK_LOGS = [
  { t: "13:42:11", lvl: "info", msg: "Listening on :8080" },
  { t: "13:42:11", lvl: "info", msg: "Connected to postgres://db.prod:5432/app" },
  { t: "13:42:14", lvl: "info", msg: "GET /healthz 200 1.4ms" },
  { t: "13:42:16", lvl: "warn", msg: "slow query (312ms): SELECT * FROM users WHERE ..." },
  { t: "13:42:18", lvl: "info", msg: "GET /api/v1/jobs 200 8.3ms" },
  { t: "13:42:20", lvl: "error", msg: "upstream timeout: billing-api:8080" },
];

const logLevelColor: Record<string, string> = {
  info: "var(--mantine-color-dimmed)",
  warn: "var(--mantine-color-warning-6)",
  error: "var(--mantine-color-danger-6)",
};

interface PodDetailDrawerProps {
  pod: Pod | null;
  onClose: () => void;
}

export function PodDetailDrawer({ pod, onClose }: PodDetailDrawerProps) {
  const [tab, setTab] = useState<string | null>("overview");

  const phase = pod?.status?.phase;
  const containerStatuses = pod?.status?.containerStatuses ?? [];
  const readyCount = containerStatuses.filter((c) => c.ready).length;
  const totalContainers = containerStatuses.length;
  const restarts = containerStatuses.reduce((s, c) => s + c.restartCount, 0);
  const age = podAge(pod?.metadata.creationTimestamp);

  const specYaml = pod
    ? jsYaml.dump(
        {
          apiVersion: "v1",
          kind: "Pod",
          metadata: pod.metadata,
          spec: pod.spec,
          status: pod.status,
        },
        { lineWidth: -1 }
      )
    : "";

  const conditions = [
    "PodScheduled",
    "Initialized",
    "ContainersReady",
    "Ready",
  ];

  const labels = pod?.metadata.labels ?? {};

  return (
    <Drawer
      opened={!!pod}
      onClose={onClose}
      position="right"
      size={760}
      withCloseButton={false}
      styles={{
        body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 },
        content: { display: "flex", flexDirection: "column" },
      }}
    >
      {/* Summary header */}
      <Box
        px="lg"
        py="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)", background: "var(--mantine-color-default-hover)" }}
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
          <Button variant="default" size="xs" leftSection={<IconCode size={12} />}>
            Logs
          </Button>
          <Button variant="default" size="xs" leftSection={<IconTerminal size={12} />}>
            Exec
          </Button>
          <Button variant="default" size="xs" leftSection={<IconEdit size={12} />}>
            Edit
          </Button>
          <Button variant="outline" color="danger" size="xs" leftSection={<IconTrash size={12} />}>
            Delete
          </Button>
        </Group>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
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
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.06em" }} mb="sm">
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
                  fontSize: 13,
                }}
              >
                {[
                  ["Namespace", pod?.metadata.namespace ?? "default"],
                  ["Node", pod?.spec?.nodeName ?? "–"],
                  ["Pod IP", pod?.status?.podIP ?? "–"],
                  ["Image", pod?.spec?.containers?.[0]?.image ?? "–"],
                  [
                    "Containers",
                    totalContainers > 0 ? `${readyCount}/${totalContainers}` : "–",
                  ],
                  ["Age", age],
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
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.06em" }} mb="sm">
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
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.06em" }} mb="sm">
                Conditions
              </Text>
              <Stack gap="xs">
                {conditions.map((cond) => {
                  const ok =
                    cond === "PodScheduled" ||
                    cond === "Initialized" ||
                    phase === "Running";
                  return (
                    <Group key={cond} gap="xs">
                      {ok ? (
                        <IconCheck size={14} color="var(--mantine-color-success-6)" />
                      ) : (
                        <IconAlertTriangle size={14} color="var(--mantine-color-warning-6)" />
                      )}
                      <Text size="sm" ff="monospace">
                        {cond}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {ok ? "True" : "False"}
                      </Text>
                    </Group>
                  );
                })}
              </Stack>
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
              overflow: "auto",
            }}
          >
            {specYaml}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="events" p="lg">
          <Table>
            <Table.Thead>
              <Table.Tr>
                {["Type", "Reason", "Message", "Age"].map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MOCK_EVENTS.map((e, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Badge size="xs" color={e.type === "Normal" ? "gray" : "warning"} variant="light">
                      {e.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{e.reason}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{e.msg}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" ff="monospace">{e.t}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="logs" p="lg">
          <Box
            style={{
              background: "var(--mantine-color-dark-8, #0f0f11)",
              color: "var(--mantine-color-dark-0, #fafafa)",
              borderRadius: 6,
              padding: 12,
              fontFamily: "var(--mantine-font-monospace, monospace)",
              fontSize: 12.5,
              lineHeight: 1.6,
              border: "1px solid var(--mantine-color-dark-4, #3f3f46)",
            }}
          >
            {MOCK_LOGS.map((l, i) => (
              <div key={i}>
                <span style={{ color: "var(--mantine-color-dark-2, #a1a1aa)" }}>{l.t}</span>{" "}
                <span
                  style={{
                    color: logLevelColor[l.lvl],
                    textTransform: "uppercase",
                    fontSize: 10,
                    padding: "0 4px",
                  }}
                >
                  [{l.lvl}]
                </span>{" "}
                <span>{l.msg}</span>
              </div>
            ))}
            <div style={{ color: "var(--mantine-color-success-5)" }}>▊</div>
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  );
}
