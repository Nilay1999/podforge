import { useState } from "react";
import {
  Button,
  Divider,
  Drawer,
  Group,
  Tabs,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCode, IconForms } from "@tabler/icons-react";
import jsYaml from "js-yaml";
import type { CreateConfigMapRequest, ResourceKind } from "../../types";
import { ManifestForm } from "../forms/ManifestForm";
import { ManifestEditor } from "./ManifestEditor";

interface ManifestDrawerProps {
  opened: boolean;
  onClose: () => void;
  kind: ResourceKind;
}

function buildConfigMapManifest(p: CreateConfigMapRequest): object {
  const metadata: Record<string, unknown> = {
    name: p.name || "",
    namespace: p.namespace || "default",
  };
  if (p.labels && Object.keys(p.labels).length) metadata.labels = p.labels;
  if (p.annotations && Object.keys(p.annotations).length) metadata.annotations = p.annotations;

  const manifest: Record<string, unknown> = {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata,
  };
  if (p.data && Object.keys(p.data).length) manifest.data = p.data;
  if (p.binaryData && Object.keys(p.binaryData).length) manifest.binaryData = p.binaryData;
  if (p.immutable) manifest.immutable = p.immutable;

  return manifest;
}

function parseConfigMapManifest(raw: unknown): CreateConfigMapRequest {
  const m = raw as Record<string, any>;
  return {
    name: m?.metadata?.name ?? "",
    namespace: m?.metadata?.namespace ?? "default",
    labels: m?.metadata?.labels,
    annotations: m?.metadata?.annotations,
    data: m?.data,
    binaryData: m?.binaryData,
    immutable: m?.immutable,
  };
}

export function ManifestDrawer({ opened, onClose, kind }: ManifestDrawerProps) {
  const formId = "manifest-drawer-form";
  const [activeTab, setActiveTab] = useState("form");
  const [editorValue, setEditorValue] = useState("");
  const [configMapPayload, setConfigMapPayload] = useState<CreateConfigMapRequest>({
    name: "",
    namespace: "default",
  });
  const [formKey, setFormKey] = useState(0);

  const handleTabChange = (tab: string | null) => {
    if (!tab || tab === activeTab) return;

    if (tab === "yaml" && kind === "ConfigMap") {
      setEditorValue(jsYaml.dump(buildConfigMapManifest(configMapPayload), { lineWidth: -1 }));
    } else if (tab === "form" && kind === "ConfigMap") {
      try {
        const parsed = jsYaml.load(editorValue);
        setConfigMapPayload(parseConfigMapManifest(parsed));
        setFormKey((k) => k + 1);
      } catch {
        notifications.show({
          title: "Invalid YAML",
          message: "Fix syntax errors before switching back to the form.",
          color: "red",
        });
        return;
      }
    }

    setActiveTab(tab);
  };

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
          padding: 0,
        },
        content: { display: "flex", flexDirection: "column" },
      }}
    >
      {/* Header */}
      <Group px="lg" py="md" justify="space-between">
        <Group gap="xs">
          <ThemeIcon variant="light" size="md">
            <IconForms size={16} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            Create {kind}
          </Text>
        </Group>
        <Button variant="subtle" color="gray" size="xs" onClick={onClose}>
          ✕ Close
        </Button>
      </Group>

      <Divider />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        styles={{
          panel: { flex: 1, overflowY: "auto" },
        }}
      >
        <Tabs.List px="lg" pt="xs">
          <Tabs.Tab value="form" leftSection={<IconForms size={14} />}>
            Form
          </Tabs.Tab>
          <Tabs.Tab value="yaml" leftSection={<IconCode size={14} />}>
            YAML
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="form">
          <ManifestForm
            key={formKey}
            kind={kind}
            formId={formId}
            onSubmit={(values) => {
              notifications.show({
                title: `${kind} ready`,
                message: `Form submitted for "${values.name || "unnamed"}"`,
                color: "teal",
              });
              onClose();
            }}
            onPayloadChange={kind === "ConfigMap" ? (setConfigMapPayload as (p: typeof configMapPayload) => void) : undefined}
            defaultPayload={kind === "ConfigMap" ? configMapPayload : undefined}
          />
        </Tabs.Panel>

        <Tabs.Panel value="yaml" style={{ height: "100%", overflow: "hidden" }}>
          <ManifestEditor value={editorValue} onChange={setEditorValue} />
        </Tabs.Panel>
      </Tabs>

      {/* Footer */}
      <Divider />
      <Group px="lg" py="md" justify="flex-start">
        <Button variant="subtle" color="gray" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" form={formId}>
          Apply
        </Button>
      </Group>
    </Drawer>
  );
}
