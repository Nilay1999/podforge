import { useEffect, useState } from "react";
import {
  Box,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Button,
  Badge
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconActivity,
  IconBox,
  IconCube,
  IconFileText,
  IconPlus,
  IconRocket,
  IconServer,
  IconAlertTriangle,
  IconInfoCircle
} from "@tabler/icons-react";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import type { ResourceKind } from "@src/types";
import { useDeployments } from "@src/hooks/useDeployments";
import { usePods } from "@src/hooks/usePods";
import { useConfigMaps } from "@src/hooks/useConfigMaps";
import type { Pod } from "@src/types";
import { DEFAULT_NAMESPACES } from "@src/utils/constants";

interface ClusterEvent {
  type?: string;
  reason?: string;
  message?: string;
  regarding?: { name?: string; namespace?: string; kind?: string };
  note?: string;
  count?: number;
}

function PhaseDonut({
  running,
  pending,
  failed
}: {
  running: number;
  pending: number;
  failed: number;
}) {
  const total = running + pending + failed;
  if (total === 0) {
    return (
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "var(--mantine-color-default-hover)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Text fw={700} fz={22} lh={1}>
          0
        </Text>
        <Text fz={10} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em", marginTop: 3 }}>
          pods
        </Text>
      </div>
    );
  }
  const rPct = (running / total) * 100;
  const pPct = (pending / total) * 100;
  const bg = `conic-gradient(
    var(--mantine-color-success-5) 0 ${rPct}%,
    var(--mantine-color-warning-5) ${rPct}% ${rPct + pPct}%,
    var(--mantine-color-danger-5) ${rPct + pPct}% 100%
  )`;
  return (
    <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
      <div style={{ width: 110, height: 110, borderRadius: "50%", background: bg }} />
      <div
        style={{
          position: "absolute",
          inset: 14,
          borderRadius: "50%",
          background: "var(--mantine-color-body)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Text fw={700} fz={22} lh={1}>
          {total}
        </Text>
        <Text fz={10} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em", marginTop: 3 }}>
          pods
        </Text>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  count,
  color = "steelBlue"
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  count: string | number;
  color?: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group align="center" gap="md" wrap="nowrap">
        <ThemeIcon size={40} variant="light" color={color} radius="md" style={{ flexShrink: 0 }}>
          <Icon size={22} />
        </ThemeIcon>
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: "0.06em" }}>
            {label}
          </Text>
          <Text size="xl" fw={700} lh={1}>
            {count}
          </Text>
        </Box>
      </Group>
    </Paper>
  );
}

function EventsFeed({ events }: { events: ClusterEvent[] }) {
  if (events.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="sm">
        Waiting for cluster events…
      </Text>
    );
  }
  return (
    <Stack gap={0}>
      {events.map((e, i) => {
        const isWarning = e.type === "Warning";
        return (
          <Group
            key={i}
            gap="xs"
            py="sm"
            align="flex-start"
            style={{
              borderBottom:
                i < events.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none"
            }}
          >
            <Box
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "var(--mantine-color-default-hover)",
                color: isWarning ? "var(--mantine-color-warning-5)" : "var(--mantine-color-dimmed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {isWarning ? <IconAlertTriangle size={14} /> : <IconInfoCircle size={14} />}
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" lh={1.4}>
                {e.regarding?.name && (
                  <Text span ff="monospace" fw={500}>
                    {e.regarding.name}{" "}
                  </Text>
                )}
                <Text span c="dimmed">
                  — {e.note ?? e.message ?? e.reason ?? "event"}
                </Text>
              </Text>
            </Box>
            <Badge
              size="xs"
              color={isWarning ? "warning" : "gray"}
              variant="light"
              style={{ flexShrink: 0 }}
            >
              {e.type ?? "Normal"}
            </Badge>
          </Group>
        );
      })}
    </Stack>
  );
}

export function DashboardPage() {
  const [namespace, setNamespace] = useState("default");
  const [drawerKind, setDrawerKind] = useState<ResourceKind>("Deployment");
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [clusterEvents, setClusterEvents] = useState<ClusterEvent[]>([]);

  const { data: pods } = usePods(namespace);
  const { data: deployments } = useDeployments(namespace);
  const { data: configMaps } = useConfigMaps(namespace);

  const podItems: Pod[] = pods?.items ?? [];
  const podCounts = {
    running: podItems.filter((p) => p.status?.phase === "Running").length,
    pending: podItems.filter((p) => p.status?.phase === "Pending").length,
    failed: podItems.filter((p) => p.status?.phase === "Failed").length
  };

  useEffect(() => {
    const es = new EventSource("/api/v1/events/stream");

    const handler = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as ClusterEvent;
        setClusterEvents((prev) => [event, ...prev].slice(0, 20));
      } catch {
        // ignore malformed SSE data
      }
    };

    es.onmessage = handler;
    ["warning", "normal", "Warning", "Normal"].forEach((type) =>
      es.addEventListener(type, handler)
    );
    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  const handleCreate = (kind: ResourceKind) => {
    setDrawerKind(kind);
    openDrawer();
  };

  return (
    <>
      <ManifestDrawer opened={drawerOpened} onClose={closeDrawer} kind={drawerKind} />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <Box>
            <Title order={2}>Dashboard</Title>
            <Group gap="xs" mt={2} align="center">
              <Text size="sm" c="dimmed">
                Cluster overview · namespace
              </Text>
              <Select
                size="xs"
                value={namespace}
                onChange={(v) => v && setNamespace(v)}
                data={DEFAULT_NAMESPACES}
                style={{ minWidth: 130 }}
              />
            </Group>
          </Box>
          <Group gap="xs">
            <Button
              variant="light"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => handleCreate("Deployment")}
            >
              Create Deployment
            </Button>
            <Button
              variant="default"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => handleCreate("Pod")}
            >
              Create Pod
            </Button>
            <Button
              variant="default"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => handleCreate("ConfigMap")}
            >
              Create ConfigMap
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <SummaryCard
            icon={IconRocket}
            label="Deployments"
            count={deployments?.items.length ?? "0"}
            color="steelBlue"
          />
          <SummaryCard icon={IconBox} label="Pods" count={podItems.length || "0"} color="success" />
          <SummaryCard
            icon={IconFileText}
            label="ConfigMaps"
            count={configMaps?.items.length ?? "0"}
            color="gray"
          />
          <SummaryCard icon={IconServer} label="Services" count="0" color="gray" />
        </SimpleGrid>

        <Box style={{ maxWidth: 260 }}>
          <SummaryCard icon={IconCube} label="Nodes" count="0" color="success" />
        </Box>

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Paper withBorder p="md" radius="md">
            <Text
              size="xs"
              fw={700}
              tt="uppercase"
              c="dimmed"
              style={{ letterSpacing: "0.06em" }}
              mb="md"
            >
              Pod phase
            </Text>
            <Group gap="lg" align="center">
              <PhaseDonut
                running={podCounts.running}
                pending={podCounts.pending}
                failed={podCounts.failed}
              />
              <Stack gap="xs" style={{ flex: 1 }}>
                {[
                  {
                    label: "Running",
                    count: podCounts.running,
                    color: "var(--mantine-color-success-5)"
                  },
                  {
                    label: "Pending",
                    count: podCounts.pending,
                    color: "var(--mantine-color-warning-5)"
                  },
                  {
                    label: "Failed",
                    count: podCounts.failed,
                    color: "var(--mantine-color-danger-5)"
                  }
                ].map(({ label, count, color }) => (
                  <Group key={label} gap="xs">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: color,
                        flexShrink: 0
                      }}
                    />
                    <Text size="sm" style={{ flex: 1 }}>
                      {label}
                    </Text>
                    <Text size="sm" fw={600} ff="monospace">
                      {count}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb={4}>
              <IconActivity size={14} color="var(--mantine-color-dimmed)" />
              <Text
                size="xs"
                fw={700}
                tt="uppercase"
                c="dimmed"
                style={{ letterSpacing: "0.06em" }}
              >
                Recent events
              </Text>
              <Box style={{ flex: 1 }} />
              <Text size="xs" c="dimmed">
                live
              </Text>
            </Group>
            <EventsFeed events={clusterEvents} />
          </Paper>
        </SimpleGrid>
      </Stack>
    </>
  );
}
