import { useCallback, useEffect, useRef, useState } from "react";
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
import { useCreateConfigMap } from "@src/hooks/useConfigMaps";
import { useCreateDeployment } from "@src/hooks/useDeployments";
import { useCreatePod } from "@src/hooks/usePods";
import { ManifestForm } from "@src/components/forms/ManifestForm";
import { ManifestEditor } from "./ManifestEditor";
import { KIND_STRATEGIES, type AnyPayload } from "./kindStrategies";

interface ManifestDrawerProps {
  opened: boolean;
  onClose: () => void;
  kind: ResourceKind;
  initialPayload?: AnyPayload;
  onApply?: (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void },
  ) => void;
}

export function ManifestDrawer({
  opened,
  onClose,
  kind,
  initialPayload,
  onApply,
}: ManifestDrawerProps) {
  const formId = "manifest-drawer-form";
  const strategy = KIND_STRATEGIES[kind];
  const isEditMode = Boolean(onApply);

  const createConfigMap = useCreateConfigMap();
  const createDeployment = useCreateDeployment();
  const createPod = useCreatePod();

  const isPending =
    createConfigMap.isPending ||
    createDeployment.isPending ||
    createPod.isPending;

  const handleCreate = (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void },
  ) => {
    if (kind === "ConfigMap")
      createConfigMap.mutate(
        payload as Parameters<typeof createConfigMap.mutate>[0],
        opts,
      );
    else if (kind === "Deployment")
      createDeployment.mutate(
        payload as Parameters<typeof createDeployment.mutate>[0],
        opts,
      );
    else
      createPod.mutate(payload as Parameters<typeof createPod.mutate>[0], opts);
  };

  const [activeTab, setActiveTab] = useState("form");
  const [editorValue, setEditorValue] = useState("");
  const [pendingPayload, setPendingPayload] = useState<AnyPayload>(
    () => initialPayload ?? strategy.initialPayload,
  );
  const [formKey, setFormKey] = useState(0);
  const getPayloadRef = useRef<(() => AnyPayload) | null>(null);

  useEffect(() => {
    if (!opened) return;
    const payload = initialPayload ?? strategy.initialPayload;
    setPendingPayload(payload);
    setEditorValue(jsYaml.dump(strategy.toManifest(payload), { lineWidth: -1 }));
    setActiveTab("form");
    setFormKey((k) => k + 1);
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const registerGetPayload = useCallback((fn: (() => AnyPayload) | null) => {
    getPayloadRef.current = fn;
  }, []);

  const applyPayload = (payload: AnyPayload) => {
    const apply = onApply ?? handleCreate;
    apply(payload, {
      onSuccess: () => {
        notifications.show({
          title: isEditMode ? `${kind} updated` : `${kind} created`,
          message: `"${(payload as { name?: string }).name}" was ${isEditMode ? "updated" : "created"} successfully.`,
          color: "teal",
        });
        onClose();
      },
      onError: (err) => {
        notifications.show({
          title: `Failed to ${isEditMode ? "update" : "create"} ${kind}`,
          message: err.message,
          color: "red",
        });
      },
    });
  };

  const handleApplyClick = () => {
    if (activeTab === "yaml") {
      let parsed: unknown;
      try {
        parsed = jsYaml.load(editorValue);
      } catch {
        notifications.show({
          title: "Invalid YAML",
          message: "Fix syntax errors before applying.",
          color: "red",
        });
        return;
      }
      applyPayload(strategy.fromManifest(parsed));
    } else {
      const formEl = document.getElementById(formId) as HTMLFormElement | null;
      formEl?.requestSubmit();
    }
  };

  const handleTabChange = (tab: string | null) => {
    if (!tab || tab === activeTab) return;

    if (tab === "yaml") {
      const payload = getPayloadRef.current?.() ?? pendingPayload;
      setEditorValue(
        jsYaml.dump(strategy.toManifest(payload), { lineWidth: -1 }),
      );
    } else if (tab === "form") {
      try {
        const parsed = jsYaml.load(editorValue);
        setPendingPayload(strategy.fromManifest(parsed));
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
              {isEditMode ? "Edit" : "Create"} {kind}
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
            onSubmit={(values) => applyPayload(values)}
            registerGetPayload={
              registerGetPayload as (
                fn: (() => AnyPayload) | null,
              ) => void
            }
            defaultPayload={pendingPayload}
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
        <Button
          type="button"
          onClick={handleApplyClick}
          loading={isPending}
        >
          {isEditMode ? "Save changes" : "Apply"}
        </Button>
      </Group>
    </Drawer>
  );
}
