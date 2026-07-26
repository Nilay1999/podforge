import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  NumberInput,
  Stack,
  Table,
  Text,
  Tabs
} from "@mantine/core";
import {
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconCode,
  IconDownload,
  IconInfoCircle,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconX
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import jsYaml from "js-yaml";
import type { Deployment } from "@src/types";
import { getDeploymentOverview } from "@src/api/deployments";
import { useScaleDeployment, useRestartDeployment } from "@src/hooks/useDeployments";
import { formatAge } from "@src/components/common/ResourceListPage";
import { downloadTextFile } from "@src/utils/helper";

interface DeploymentDetailDrawerProps {
  deployment: Deployment | null;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function DeploymentDetailDrawer({
  deployment,
  onClose,
  onDelete,
  onEdit
}: DeploymentDetailDrawerProps) {
  const [tab, setTab] = useState<string | null>("overview");
  const [scaleValue, setScaleValue] = useState<number | string>("");

  const ns = deployment?.metadata.namespace ?? "default";
  const name = deployment?.metadata.name ?? "";

  const scaleMutation = useScaleDeployment(ns);
  const restartMutation = useRestartDeployment(ns);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["deployment-overview", ns, name],
    queryFn: () => getDeploymentOverview(ns, name),
    enabled: !!deployment,
    staleTime: 30_000
  });

  const currentReplicas = deployment?.spec?.replicas ?? 0;
  const readyReplicas = deployment?.status?.readyReplicas ?? 0;
  const availableReplicas = deployment?.status?.availableReplicas ?? 0;
  const conditions = (overview as any)?.deployment?.status?.conditions ?? [];
  const events = (overview as any)?.events ?? [];

  const specYaml = deployment
    ? jsYaml.dump(
        {
          apiVersion: "apps/v1",
          kind: "Deployment",
          metadata: deployment.metadata,
          spec: deployment.spec,
          status: deployment.status
        },
        { lineWidth: -1 }
      )
    : "";

  const handleScale = () => {
    const replicas = typeof scaleValue === "number" ? scaleValue : parseInt(String(scaleValue), 10);
    if (isNaN(replicas) || replicas < 0) return;
    scaleMutation.mutate(
      { name, replicas },
      {
        onSuccess: () => {
          notifications.show({ title: "Scaled", message: `${name} → ${replicas} replicas`, color: "success" });
          setScaleValue("");
        },
        onError: (err) =>
          notifications.show({ title: "Scale failed", message: err.message, color: "danger" })
      }
    );
  };

  const handleRestart = () => {
    restartMutation.mutate(name, {
      onSuccess: () =>
        notifications.show({ title: "Rollout restart triggered", message: name, color: "success" }),
      onError: (err) =>
        notifications.show({ title: "Restart failed", message: err.message, color: "danger" })
    });
  };

  return (
    <Drawer
      opened={!!deployment}
      onClose={onClose}
      position="right"
      size={760}
      withCloseButton={false}
      styles={{
        body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 },
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
            {name}
          </Text>
          <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close">
            <IconX size={16} />
          </ActionIcon>
        </Group>
        <Group gap="xs" wrap="wrap">
          <Badge
            color={readyReplicas === currentReplicas && currentReplicas > 0 ? "success" : "warning"}
            variant="light"
          >
            {readyReplicas}/{currentReplicas} ready
          </Badge>
          <Text size="xs" c="dimmed">
            {ns} · {formatAge(deployment?.metadata.creationTimestamp)}
          </Text>
          <Box style={{ flex: 1 }} />
          <Button
            variant="default"
            size="xs"
            leftSection={<IconRefresh size={12} />}
            onClick={handleRestart}
            loading={restartMutation.isPending}
          >
            Restart
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
            color="danger"
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
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
        styles={{ panel: { flex: 1, overflowY: "auto" } }}
      >
        <Tabs.List px="lg">
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={13} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="scale" leftSection={<IconRefresh size={13} />}>
            Scale
          </Tabs.Tab>
          <Tabs.Tab value="spec" leftSection={<IconCode size={13} />}>
            Spec
          </Tabs.Tab>
          <Tabs.Tab value="events" leftSection={<IconActivity size={13} />}>
            Events
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
                  ["Namespace", ns],
                  ["Replicas", `${readyReplicas} ready / ${availableReplicas} available / ${currentReplicas} desired`],
                  ["Strategy", deployment?.spec?.strategy?.type ?? "RollingUpdate"],
                  ["Age", formatAge(deployment?.metadata.creationTimestamp)]
                ].map(([label, value]) => (
                  <>
                    <Text component="dt" size="sm" c="dimmed" key={`dt-${label}`}>
                      {label}
                    </Text>
                    <Text component="dd" size="sm" ff="monospace" style={{ margin: 0 }} key={`dd-${label}`}>
                      {value}
                    </Text>
                  </>
                ))}
              </Box>
            </section>

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
                  {conditions.map((cond: any) => (
                    <Group key={cond.type} gap="xs">
                      {cond.status === "True" ? (
                        <IconCheck size={14} color="var(--mantine-color-success-text)" />
                      ) : (
                        <IconAlertTriangle size={14} color="var(--mantine-color-warning-text)" />
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

        <Tabs.Panel value="scale" p="lg">
          <Stack gap="md" maw={320}>
            <Text size="sm" c="dimmed">
              Current replica count:{" "}
              <Text span fw={600} ff="monospace">
                {currentReplicas}
              </Text>
            </Text>
            <NumberInput
              label="Desired replicas"
              placeholder={String(currentReplicas)}
              min={0}
              max={100}
              value={scaleValue}
              onChange={setScaleValue}
            />
            <Button
              onClick={handleScale}
              loading={scaleMutation.isPending}
              disabled={scaleValue === "" || scaleValue === currentReplicas}
            >
              Scale Deployment
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="spec" p="lg">
          <Group justify="flex-end" mb="sm">
            <Button
              variant="light"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={() =>
                downloadTextFile(
                  `${deployment?.metadata.name ?? "deployment"}.yaml`,
                  specYaml,
                  "application/yaml"
                )
              }
              disabled={!specYaml}
            >
              Download YAML
            </Button>
          </Group>
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
                {events.map((e: any, i: number) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Badge size="xs" color={e.type === "Normal" ? "gray" : "warning"} variant="light">
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
      </Tabs>
    </Drawer>
  );
}
