import {
  ActionIcon,
  Badge,
  Code,
  Divider,
  Drawer,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  ThemeIcon
} from "@mantine/core";
import { IconServer, IconX } from "@tabler/icons-react";
import { useNode } from "@src/hooks/useNodes";
import { formatAge } from "@src/components/common/ResourceListPage";
import { isNodeReady, nodeInternalIP, nodeRoles } from "./nodeUtils";

interface NodeDetailDrawerProps {
  nodeName: string | null;
  onClose: () => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: 0.4 }}>
      {children}
    </Text>
  );
}

export function NodeDetailDrawer({ nodeName, onClose }: NodeDetailDrawerProps) {
  const { data: node, isLoading, error } = useNode(nodeName);

  const ready = node ? isNodeReady(node) : false;
  const capacity = node?.status?.capacity ?? {};
  const allocatable = node?.status?.allocatable ?? {};
  const resourceKeys = Array.from(
    new Set([...Object.keys(capacity), ...Object.keys(allocatable)])
  ).sort();
  const conditions = node?.status?.conditions ?? [];
  const taints = node?.spec?.taints ?? [];
  const info = node?.status?.nodeInfo;

  return (
    <Drawer
      opened={!!nodeName}
      onClose={onClose}
      position="right"
      size="lg"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
    >
      <Group px="lg" py="md" justify="space-between">
        <Group gap="sm">
          <ThemeIcon variant="light" size="md" color="steelBlue">
            <IconServer size={16} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600} size="md" ff="monospace">
              {nodeName}
            </Text>
            <Group gap="xs">
              <Badge color={ready ? "success" : "danger"} variant="light" size="sm">
                {ready ? "Ready" : "NotReady"}
              </Badge>
              {node?.spec?.unschedulable && (
                <Badge color="warning" variant="light" size="sm">
                  SchedulingDisabled
                </Badge>
              )}
              {node && (
                <Text size="xs" c="dimmed">
                  {formatAge(node.metadata.creationTimestamp)}
                </Text>
              )}
            </Group>
          </Stack>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close">
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Divider />

      <Stack gap="lg" p="lg">
        {isLoading && <Loader />}
        {error && (
          <Text c="red" size="sm">
            {error.message}
          </Text>
        )}

        {node && (
          <>
            <Stack gap="xs">
              <SectionTitle>Details</SectionTitle>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={140}>
                  Roles
                </Text>
                <Text size="sm" ff="monospace">
                  {nodeRoles(node).join(", ")}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={140}>
                  Internal IP
                </Text>
                <Text size="sm" ff="monospace">
                  {nodeInternalIP(node)}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={140}>
                  Kubelet
                </Text>
                <Text size="sm" ff="monospace">
                  {info?.kubeletVersion ?? "–"}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={140}>
                  OS
                </Text>
                <Text size="sm" ff="monospace">
                  {info?.osImage ?? "–"}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={140}>
                  Container runtime
                </Text>
                <Text size="sm" ff="monospace">
                  {info?.containerRuntimeVersion ?? "–"}
                </Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={140}>
                  Architecture
                </Text>
                <Text size="sm" ff="monospace">
                  {info?.architecture ?? "–"}
                </Text>
              </Group>
            </Stack>

            <Stack gap="xs">
              <SectionTitle>Capacity / Allocatable</SectionTitle>
              <Table style={{ fontSize: 13 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Resource</Table.Th>
                    <Table.Th>Capacity</Table.Th>
                    <Table.Th>Allocatable</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {resourceKeys.map((k) => (
                    <Table.Tr key={k}>
                      <Table.Td ff="monospace">{k}</Table.Td>
                      <Table.Td ff="monospace">{capacity[k] ?? "–"}</Table.Td>
                      <Table.Td ff="monospace">{allocatable[k] ?? "–"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>

            <Stack gap="xs">
              <SectionTitle>Conditions</SectionTitle>
              {conditions.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No conditions reported.
                </Text>
              ) : (
                <Table style={{ fontSize: 13 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Reason</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {conditions.map((c) => (
                      <Table.Tr key={c.type}>
                        <Table.Td ff="monospace">{c.type}</Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            variant="light"
                            color={c.status === "True" ? "success" : c.status === "False" ? "gray" : "warning"}
                          >
                            {c.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td c="dimmed">{c.reason ?? "–"}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>

            <Stack gap="xs">
              <SectionTitle>Taints</SectionTitle>
              {taints.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No taints.
                </Text>
              ) : (
                <Stack gap={6}>
                  {taints.map((t) => (
                    <Code key={`${t.key}:${t.effect}`}>
                      {t.key}
                      {t.value ? `=${t.value}` : ""}:{t.effect}
                    </Code>
                  ))}
                </Stack>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
