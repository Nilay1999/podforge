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
import { IconCode, IconForms } from "@tabler/icons-react";
import type { ResourceKind } from "../../types";

interface ManifestDrawerProps {
  opened: boolean;
  onClose: () => void;
  kind: ResourceKind;
}

// Placeholder tabs — form and editor content will be dropped in here next
function FormTab() {
  return (
    <Box p="md">
      <Text c="dimmed" size="sm">
        Form fields for the resource will appear here.
      </Text>
    </Box>
  );
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
          <FormTab />
        </Tabs.Panel>

        <Tabs.Panel value="yaml">
          <YamlTab />
        </Tabs.Panel>
      </Tabs>

      {/* Footer */}
      <Divider />
      <Group px="lg" py="md" justify="flex-start">
        <Button variant="subtle" color="gray" onClick={onClose}>
          Cancel
        </Button>
        <Button>Apply</Button>
      </Group>
    </Drawer>
  );
}
