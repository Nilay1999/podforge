import { useState } from "react";
import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconActivity,
  IconBox,
  IconCheck,
  IconCube,
  IconFileText,
  IconPlus,
  IconRocket,
  IconServer,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";
import type { ResourceKind } from "@src/types";
import { useDeployments } from "@src/hooks/useDeployments";
import { usePods } from "@src/hooks/usePods";
import { useConfigMaps } from "@src/hooks/useConfigMaps";
import type { Pod } from "@src/types";

function PhaseDonut({
  running,
  pending,
  failed,
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
          flexShrink: 0,
        }}
      >
        <Text fw={700} fz={22} lh={1}>
          0
        </Text>
        <Text
          fz={10}
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: "0.06em", marginTop: 3 }}
        >
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
    <div
      style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}
    >
      <div
        style={{ width: 110, height: 110, borderRadius: "50%", background: bg }}
      />
      <div
        style={{
          position: "absolute",
          inset: 14,
          borderRadius: "50%",
          background: "var(--mantine-color-body)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text fw={700} fz={22} lh={1}>
          {total}
        </Text>
        <Text
          fz={10}
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: "0.06em", marginTop: 3 }}
        >
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
  delta,
  color = "steelBlue",
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  count: string | number;
  delta?: string;
  color?: string;
}) {
  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{ background: "var(--mantine-color-dark-5)" }}
    >
      <Group align="center" gap="md" wrap="nowrap">
        <ThemeIcon
          size={40}
          variant="light"
          color={color}
          radius="md"
          style={{ flexShrink: 0 }}
        >
          <Icon size={22} />
        </ThemeIcon>
        <Box>
          <Text
            size="xs"
            c="dimmed"
            tt="uppercase"
            fw={700}
            style={{ letterSpacing: "0.06em" }}
          >
            {label}
          </Text>
          <Group gap={6} align="baseline">
            <Text size="xl" fw={700} lh={1}>
              {count}
            </Text>
            {delta && (
              <Text size="xs" c="dimmed">
                {delta}
              </Text>
            )}
          </Group>
        </Box>
      </Group>
    </Paper>
  );
}

const STATIC_EVENTS = [
  {
    icon: IconCheck,
    color: "success",
    who: "nginx-frontend",
    what: "Scaled deployment to 3 replicas",
    t: "12s",
  },
  {
    icon: IconAlertTriangle,
    color: "danger",
    who: "migrator-7d4c-lkj22",
    what: "CrashLoopBackOff (container: migrator)",
    t: "1m",
  },
  {
    icon: IconBox,
    color: "gray",
    who: "api-worker-5fd8",
    what: "Pulled image api:v2.8.1 (1.2s)",
    t: "4m",
  },
  {
    icon: IconRocket,
    color: "steelBlue",
    who: "billing-api",
    what: "RollingUpdate started (v2.7.0 → v2.8.1)",
    t: "11m",
  },
  {
    icon: IconFileText,
    color: "gray",
    who: "redis-config",
    what: "ConfigMap updated (2 keys changed)",
    t: "26m",
  },
  {
    icon: IconCheck,
    color: "success",
    who: "nginx-7f9c4d",
    what: "Created pod on ip-10-0-1-23",
    t: "1h",
  },
] as const;

const colorVars: Record<string, string> = {
  success: "var(--mantine-color-success-5)",
  danger: "var(--mantine-color-danger-5)",
  steelBlue: "var(--mantine-color-steelBlue-5)",
  gray: "var(--mantine-color-dimmed)",
};

function EventsFeed() {
  return (
    <Stack gap={0}>
      {STATIC_EVENTS.map((e, i) => (
        <Group
          key={i}
          gap="xs"
          py="sm"
          align="flex-start"
          style={{
            borderBottom:
              i < STATIC_EVENTS.length - 1
                ? "1px solid var(--mantine-color-default-border)"
                : "none",
          }}
        >
          <Box
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "var(--mantine-color-default-hover)",
              color: colorVars[e.color],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <e.icon size={14} />
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" lh={1.4}>
              <Text span ff="monospace" fw={500}>
                {e.who}
              </Text>{" "}
              <Text span c="dimmed">
                — {e.what}
              </Text>
            </Text>
          </Box>
          <Text size="xs" c="dimmed" ff="monospace" style={{ flexShrink: 0 }}>
            {e.t} ago
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

export function DashboardPage() {
  const [drawerKind, setDrawerKind] = useState<ResourceKind>("Deployment");
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const { data: pods } = usePods("default");
  const { data: deployments } = useDeployments("default");
  const { data: configMaps } = useConfigMaps("default");

  const podItems: Pod[] = pods?.items ?? [];
  const podCounts = {
    running: podItems.filter((p) => p.status?.phase === "Running").length,
    pending: podItems.filter((p) => p.status?.phase === "Pending").length,
    failed: podItems.filter(
      (p) =>
        p.status?.phase === "Failed" ||
        (p.status?.phase as string) === "CrashLoopBackOff",
    ).length,
  };

  const handleCreate = (kind: ResourceKind) => {
    setDrawerKind(kind);
    openDrawer();
  };

  return (
    <>
      <ManifestDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        kind={drawerKind}
      />

      <Stack gap="lg">
        {/* Page header */}
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <Box>
            <Title order={2}>Dashboard</Title>
            <Text size="sm" c="dimmed" mt={2}>
              Cluster overview · namespace{" "}
              <Text span ff="monospace" c="var(--mantine-color-text)">
                default
              </Text>
            </Text>
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

        {/* Summary cards */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <SummaryCard
            icon={IconRocket}
            label="Deployments"
            count={deployments?.items.length ?? "–"}
            delta={deployments?.items.length ? "+1 today" : undefined}
            color="steelBlue"
          />
          <SummaryCard
            icon={IconBox}
            label="Pods"
            count={podItems.length || "–"}
            delta={podItems.length ? "+3 today" : undefined}
            color="success"
          />
          <SummaryCard
            icon={IconFileText}
            label="ConfigMaps"
            count={configMaps?.items.length ?? "–"}
            color="gray"
          />
          <SummaryCard
            icon={IconServer}
            label="Services"
            count="–"
            color="gray"
          />
        </SimpleGrid>

        {/* Nodes card — separate row */}
        <Box style={{ maxWidth: 260 }}>
          <SummaryCard
            icon={IconCube}
            label="Nodes"
            count="–"
            delta="all ready"
            color="success"
          />
        </Box>

        {/* Phase chart + events */}
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
                    color: "var(--mantine-color-success-5)",
                  },
                  {
                    label: "Pending",
                    count: podCounts.pending,
                    color: "var(--mantine-color-warning-5)",
                  },
                  {
                    label: "Failed",
                    count: podCounts.failed,
                    color: "var(--mantine-color-danger-5)",
                  },
                ].map(({ label, count, color }) => (
                  <Group key={label} gap="xs">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: color,
                        flexShrink: 0,
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
                last 1h
              </Text>
            </Group>
            <EventsFeed />
          </Paper>
        </SimpleGrid>
      </Stack>
    </>
  );
}
