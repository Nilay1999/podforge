import {
  Box,
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
import type { ResourceKind } from "../../types";
import { ManifestForm } from "../forms/ManifestForm";

interface ManifestDrawerProps {
  opened: boolean;
  onClose: () => void;
  kind: ResourceKind;
}

function YamlTab() {
  return (
    <Box p="md">
      <Text c="dimmed" size="sm">
        YAML editor will appear here.
      </Text>
    </Box>
  );
}

export function ManifestDrawer({ opened, onClose, kind }: ManifestDrawerProps) {
  const formId = "manifest-drawer-form";

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
        defaultValue="form"
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
          />
        </Tabs.Panel>

        <Tabs.Panel value="yaml">
          <YamlTab />
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
