import { useState } from "react";
import {
  ActionIcon,
  Button,
  Divider,
  Drawer,
  Group,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCode, IconForms, IconX } from "@tabler/icons-react";
import jsYaml from "js-yaml";
import type { ResourceKind } from "@src/types";
import { ManifestForm } from "@src/components/forms/ManifestForm";
import { ManifestEditor } from "./ManifestEditor";
import { KIND_STRATEGIES, type AnyPayload } from "./kindStrategies";

interface ManifestDrawerProps {
  opened: boolean;
  onClose: () => void;
  kind: ResourceKind;
}

export function ManifestDrawer({ opened, onClose, kind }: ManifestDrawerProps) {
  const formId = "manifest-drawer-form";
  const strategy = KIND_STRATEGIES[kind];

  const [activeTab, setActiveTab] = useState("form");
  const [editorValue, setEditorValue] = useState("");
  const [formPayload, setFormPayload] = useState<AnyPayload>(
    () => strategy.initialPayload,
  );
  const [formKey, setFormKey] = useState(0);

  const handleTabChange = (tab: string | null) => {
    if (!tab || tab === activeTab) return;

    if (tab === "yaml") {
      setEditorValue(
        jsYaml.dump(strategy.toManifest(formPayload), { lineWidth: -1 }),
      );
    } else if (tab === "form") {
      try {
        const parsed = jsYaml.load(editorValue);
        setFormPayload(strategy.fromManifest(parsed));
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
      <Group px="lg" py="md" justify="space-between">
        <Group gap="sm">
          <ThemeIcon variant="light" size="md" color="steelBlue">
            <IconForms size={16} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600} size="md">
              Create {kind}
            </Text>
            <Text size="xs" c="dimmed">
              Fill the form or edit YAML directly. Changes sync both ways.
            </Text>
          </Stack>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Divider />

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
            onPayloadChange={setFormPayload as (p: AnyPayload) => void}
            defaultPayload={formPayload}
          />
        </Tabs.Panel>

        <Tabs.Panel value="yaml" style={{ height: "100%", overflow: "hidden" }}>
          <ManifestEditor value={editorValue} onChange={setEditorValue} />
        </Tabs.Panel>
      </Tabs>

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
