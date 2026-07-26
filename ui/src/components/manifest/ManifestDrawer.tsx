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
  ThemeIcon
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBook, IconCode, IconForms, IconGitCompare, IconX } from "@tabler/icons-react";
import jsYaml from "js-yaml";
import type { ResourceKind } from "@src/types";
import { useCreateConfigMap } from "@src/hooks/useConfigMaps";
import { useCreateDeployment } from "@src/hooks/useDeployments";
import { useCreatePod } from "@src/hooks/usePods";
import { useCreateService } from "@src/hooks/useServices";
import { useCreateSecret } from "@src/hooks/useSecrets";
import { FormDocs } from "@src/components/forms/FormDocs";
import { ManifestForm } from "@src/components/forms/ManifestForm";
import { ManifestEditor } from "./ManifestEditor";
import { ManifestDiff } from "./ManifestDiff";
import { KIND_STRATEGIES, type AnyPayload } from "./kindStrategies";

interface ManifestDrawerProps {
  opened: boolean;
  onClose: () => void;
  kind: ResourceKind;
  initialPayload?: AnyPayload;
  onApply?: (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void }
  ) => void;
}

export function ManifestDrawer({
  opened,
  onClose,
  kind,
  initialPayload,
  onApply
}: ManifestDrawerProps) {
  const formId = "manifest-drawer-form";
  const strategy = KIND_STRATEGIES[kind];
  const isEditMode = Boolean(onApply);

  const createConfigMap = useCreateConfigMap();
  const createDeployment = useCreateDeployment();
  const createPod = useCreatePod();
  const createService = useCreateService();
  const createSecret = useCreateSecret();

  const isPending =
    createConfigMap.isPending ||
    createDeployment.isPending ||
    createPod.isPending ||
    createService.isPending ||
    createSecret.isPending;

  const creators = {
    ConfigMap: createConfigMap,
    Deployment: createDeployment,
    Pod: createPod,
    Service: createService,
    Secret: createSecret
  };

  const handleCreate = (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void }
  ) => {
    (creators[kind].mutate as (payload: AnyPayload, opts: { onSuccess: () => void; onError: (err: Error) => void }) => void)(payload, opts);
  };

  const [activeTab, setActiveTab] = useState("form");
  const [editorValue, setEditorValue] = useState("");
  const [originalYaml, setOriginalYaml] = useState("");
  const [diffModified, setDiffModified] = useState("");
  const [pendingPayload, setPendingPayload] = useState<AnyPayload>(
    () => initialPayload ?? strategy.initialPayload
  );
  const [formKey, setFormKey] = useState(0);
  const getPayloadRef = useRef<(() => AnyPayload) | null>(null);

  useEffect(() => {
    if (!opened) return;
    const payload = initialPayload ?? strategy.initialPayload;
    const yaml = jsYaml.dump(strategy.toManifest(payload), { lineWidth: -1 });
    setPendingPayload(payload);
    setEditorValue(yaml);
    setOriginalYaml(yaml);
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
          color: "success"
        });
        onClose();
      },
      onError: (err) => {
        notifications.show({
          title: `Failed to ${isEditMode ? "update" : "create"} ${kind}`,
          message: err.message,
          color: "danger"
        });
      }
    });
  };

  const handleApplyClick = () => {
    if (activeTab === "yaml" || activeTab === "diff") {
      let parsed: unknown;
      try {
        parsed = jsYaml.load(editorValue);
      } catch {
        notifications.show({
          title: "Invalid YAML",
          message: "Fix syntax errors before applying.",
          color: "danger"
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
      setEditorValue(jsYaml.dump(strategy.toManifest(payload), { lineWidth: -1 }));
    } else if (tab === "diff") {
      let current = editorValue;
      if (activeTab === "form") {
        const payload = getPayloadRef.current?.() ?? pendingPayload;
        current = jsYaml.dump(strategy.toManifest(payload), { lineWidth: -1 });
        setEditorValue(current);
      }
      setDiffModified(current);
    } else if (tab === "form") {
      try {
        const parsed = jsYaml.load(editorValue);
        setPendingPayload(strategy.fromManifest(parsed));
        setFormKey((k) => k + 1);
      } catch {
        notifications.show({
          title: "Invalid YAML",
          message: "Fix syntax errors before switching back to the form.",
          color: "danger"
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
          padding: 0
        },
        content: { display: "flex", flexDirection: "column" }
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
        <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close drawer">
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
          overflow: "hidden"
        }}
        styles={{
          panel: { flex: 1, overflowY: "auto" }
        }}
      >
        <Tabs.List px="lg" pt="xs">
          <Tabs.Tab value="form" leftSection={<IconForms size={14} />}>
            Form
          </Tabs.Tab>
          <Tabs.Tab value="yaml" leftSection={<IconCode size={14} />}>
            YAML
          </Tabs.Tab>
          {isEditMode && (
            <Tabs.Tab value="diff" leftSection={<IconGitCompare size={14} />}>
              Diff
            </Tabs.Tab>
          )}
          <Tabs.Tab value="docs" leftSection={<IconBook size={14} />}>
            Docs
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="form">
          <ManifestForm
            key={formKey}
            kind={kind}
            formId={formId}
            onSubmit={(values) => applyPayload(values)}
            registerGetPayload={registerGetPayload as (fn: (() => AnyPayload) | null) => void}
            defaultPayload={pendingPayload}
          />
        </Tabs.Panel>

        <Tabs.Panel value="yaml" style={{ height: "100%", overflow: "hidden" }}>
          <ManifestEditor value={editorValue} onChange={setEditorValue} />
        </Tabs.Panel>

        {isEditMode && (
          <Tabs.Panel value="diff" style={{ height: "100%", overflow: "hidden" }}>
            <ManifestDiff original={originalYaml} modified={diffModified} />
          </Tabs.Panel>
        )}

        <Tabs.Panel value="docs" style={{ height: "100%", overflow: "hidden" }}>
          <FormDocs kind={kind} />
        </Tabs.Panel>
      </Tabs>

      {activeTab !== "docs" && (
        <>
          <Divider />
          <Group px="lg" py="md" justify="flex-start">
            <Button variant="subtle" color="gray" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="button" onClick={handleApplyClick} loading={isPending}>
              {isEditMode ? "Save changes" : "Apply"}
            </Button>
          </Group>
        </>
      )}
    </Drawer>
  );
}
