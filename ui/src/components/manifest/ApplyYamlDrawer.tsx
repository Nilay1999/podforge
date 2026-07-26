import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
  ThemeIcon
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconCheck,
  IconCloudUpload,
  IconX
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApplyResult } from "@src/types";
import { applyYaml } from "@src/api/apply";
import { useNamespaces } from "@src/hooks/useNamespaces";
import { ManifestEditor } from "./ManifestEditor";

const EDITOR_PLACEHOLDER = `# Paste one or more manifests, separated by ---
apiVersion: v1
kind: ConfigMap
metadata:
  name: example
data:
  key: value
`;

interface ApplyYamlDrawerProps {
  opened: boolean;
  onClose: () => void;
}

export function ApplyYamlDrawer({ opened, onClose }: ApplyYamlDrawerProps) {
  const [yamlValue, setYamlValue] = useState(EDITOR_PLACEHOLDER);
  const [namespace, setNamespace] = useState("default");
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: namespaceList } = useNamespaces();
  const namespaces = namespaceList?.items.map((ns) => ns.metadata.name) ?? ["default"];
  const qc = useQueryClient();

  useEffect(() => {
    if (!opened) return;
    setResult(null);
    setError(null);
  }, [opened]);

  const mutation = useMutation({
    mutationFn: (dryRun: boolean) => applyYaml({ yaml: yamlValue, namespace, dryRun }),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      if (!data.dryRun) {
        qc.invalidateQueries();
        notifications.show({
          title: "Manifests applied",
          message: `${data.applied.length} resource${data.applied.length !== 1 ? "s" : ""} applied to the cluster.`,
          color: "success"
        });
      }
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message);
    }
  });

  const validating = mutation.isPending && mutation.variables === true;
  const applying = mutation.isPending && mutation.variables === false;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
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
      <Group px="lg" py="md" justify="space-between">
        <Group gap="sm">
          <ThemeIcon variant="light" size="md" color="steelBlue">
            <IconCloudUpload size={16} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600} size="md">
              Apply YAML
            </Text>
            <Text size="xs" c="dimmed">
              Paste raw manifests (multi-document supported) and apply them to the cluster.
            </Text>
          </Stack>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close drawer">
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Divider />

      <Group px="lg" py="xs" gap="xs">
        <Select
          size="xs"
          label="Default namespace"
          description="Used for manifests without metadata.namespace"
          data={namespaces}
          value={namespace}
          onChange={(v) => setNamespace(v ?? "default")}
          searchable
          style={{ width: 240 }}
          comboboxProps={{ withinPortal: true }}
        />
      </Group>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <ManifestEditor value={yamlValue} onChange={setYamlValue} />
      </div>

      {error && (
        <Alert
          color="danger"
          variant="light"
          m="sm"
          icon={<IconAlertTriangle size={16} />}
          title="Apply failed"
          style={{ flexShrink: 0 }}
        >
          <Text size="sm" ff="monospace" style={{ wordBreak: "break-word" }}>
            {error}
          </Text>
        </Alert>
      )}

      {result && (
        <Alert
          color="success"
          variant="light"
          m="sm"
          icon={<IconCheck size={16} />}
          title={result.dryRun ? "Validation passed (server dry-run)" : "Applied successfully"}
          style={{ flexShrink: 0 }}
        >
          <Group gap="xs" wrap="wrap">
            {result.applied.map((r) => (
              <Badge key={`${r.kind}/${r.namespace ?? ""}/${r.name}`} color="success" variant="light" radius="sm">
                <Text span ff="monospace" size="xs">
                  {r.kind}/{r.name}
                  {r.namespace ? ` · ${r.namespace}` : ""}
                </Text>
              </Badge>
            ))}
          </Group>
        </Alert>
      )}

      <Divider />
      <Group px="lg" py="md" justify="flex-start">
        <Button variant="subtle" color="gray" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          variant="default"
          type="button"
          onClick={() => mutation.mutate(true)}
          loading={validating}
          disabled={applying}
        >
          Validate
        </Button>
        <Button
          type="button"
          onClick={() => mutation.mutate(false)}
          loading={applying}
          disabled={validating}
        >
          Apply to cluster
        </Button>
      </Group>
    </Drawer>
  );
}
