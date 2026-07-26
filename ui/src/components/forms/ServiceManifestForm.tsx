import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { CreateServicePortInput, CreateServiceRequest } from "@src/types";
import { type KeyValuePair, KeyValuePairsField, pairsToRecord, validatePairs } from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

function recordToPairs(record?: Record<string, string>): KeyValuePair[] {
  return record ? Object.entries(record).map(([key, value]) => ({ key, value })) : [];
}

const SERVICE_TYPES = ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"];
const PROTOCOLS = ["TCP", "UDP", "SCTP"];

interface PortRow {
  name: string;
  protocol: string;
  port: string;
  targetPort: string;
  nodePort: string;
}

const emptyPort = (): PortRow => ({ name: "", protocol: "TCP", port: "", targetPort: "", nodePort: "" });

export function ServiceManifestForm({
  formId,
  onSubmit,
  registerGetPayload,
  defaultPayload
}: {
  formId?: string;
  onSubmit: (payload: CreateServiceRequest) => void;
  registerGetPayload?: (fn: (() => CreateServiceRequest) | null) => void;
  defaultPayload?: Partial<CreateServiceRequest>;
}) {
  const emptyPairs = useRef<() => KeyValuePair[]>(() => []).current;
  const labelsGetter = useRef<() => KeyValuePair[]>(emptyPairs);
  const annotationsGetter = useRef<() => KeyValuePair[]>(emptyPairs);

  const registerLabels = useCallback(
    (fn: (() => KeyValuePair[]) | null) => {
      labelsGetter.current = fn ?? emptyPairs;
    },
    [emptyPairs]
  );
  const registerAnnotations = useCallback(
    (fn: (() => KeyValuePair[]) | null) => {
      annotationsGetter.current = fn ?? emptyPairs;
    },
    [emptyPairs]
  );

  const [serviceType, setServiceType] = useState(defaultPayload?.type ?? "ClusterIP");
  const [selectorPairs, setSelectorPairs] = useState<KeyValuePair[]>(() =>
    recordToPairs(defaultPayload?.selector)
  );
  const [ports, setPorts] = useState<PortRow[]>(() =>
    defaultPayload?.ports?.map((p) => ({
      name: p.name ?? "",
      protocol: p.protocol ?? "TCP",
      port: String(p.port),
      targetPort: String(p.targetPort ?? p.port),
      nodePort: p.nodePort ? String(p.nodePort) : ""
    })) ?? [emptyPort()]
  );
  const [selectorError, setSelectorError] = useState<string | undefined>();

  const form = useForm<Pick<CreateServiceRequest, "name" | "namespace" | "externalName" | "clusterIP">>({
    mode: "uncontrolled",
    initialValues: {
      name: defaultPayload?.name ?? "",
      namespace: defaultPayload?.namespace ?? "default",
      externalName: defaultPayload?.externalName ?? "",
      clusterIP: defaultPayload?.clusterIP ?? ""
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name?.trim()) errors.name = "Name is required";
      if (serviceType === "ExternalName" && !values.externalName?.trim())
        errors.externalName = "External name is required for ExternalName services";
      return errors;
    }
  });

  const buildPayload = (): CreateServiceRequest => {
    const values = form.getValues();
    const mappedPorts: CreateServicePortInput[] = ports
      .filter((p) => p.port)
      .map((p) => ({
        ...(p.name ? { name: p.name } : {}),
        protocol: p.protocol,
        port: Number(p.port),
        targetPort: p.targetPort || String(p.port),
        ...((serviceType === "NodePort" || serviceType === "LoadBalancer") && p.nodePort
          ? { nodePort: Number(p.nodePort) }
          : {})
      }));

    return {
      name: values.name,
      namespace: values.namespace,
      type: serviceType,
      labels: pairsToRecord(labelsGetter.current()),
      annotations: pairsToRecord(annotationsGetter.current()),
      selector: pairsToRecord(selectorPairs),
      ports: mappedPorts.length ? mappedPorts : undefined,
      externalName: serviceType === "ExternalName" ? values.externalName : undefined,
      clusterIP: values.clusterIP || undefined
    };
  };

  const buildPayloadRef = useRef(buildPayload);
  buildPayloadRef.current = buildPayload;

  useEffect(() => {
    registerGetPayload?.(() => buildPayloadRef.current());
    return () => registerGetPayload?.(null);
  }, [registerGetPayload]);

  const updatePort = (idx: number, field: keyof PortRow, value: string) => {
    setPorts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formResult = form.validate();
    const selErr = validatePairs(selectorPairs, "Selector");
    if (formResult.hasErrors || selErr) {
      setSelectorError(selErr);
      return;
    }
    setSelectorError(undefined);
    onSubmit(buildPayload());
  };

  const showNodePort = serviceType === "NodePort" || serviceType === "LoadBalancer";

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} px="lg" py="md">
      <Stack gap="md">
        <MetadataFields
          form={form}
          initialLabels={recordToPairs(defaultPayload?.labels)}
          initialAnnotations={recordToPairs(defaultPayload?.annotations)}
          registerLabels={registerLabels}
          registerAnnotations={registerAnnotations}
          namePlaceholder="my-service"
        />

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Service</Text>
            <Select
              label="Type"
              data={SERVICE_TYPES}
              value={serviceType}
              onChange={(v) => setServiceType(v ?? "ClusterIP")}
              allowDeselect={false}
            />
            {serviceType === "ExternalName" && (
              <TextInput
                label="External Name"
                placeholder="example.com"
                withAsterisk
                key={form.key("externalName")}
                {...form.getInputProps("externalName")}
              />
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Selector</Text>
            <KeyValuePairsField
              label="Pod Selector"
              description="Pods with matching labels will receive traffic"
              pairs={selectorPairs}
              onChange={(pairs) => {
                setSelectorPairs(pairs);
                setSelectorError(undefined);
              }}
              error={selectorError}
              keyPlaceholder="app"
              valuePlaceholder="myapp"
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>Ports</Text>
              <Button
                size="compact-xs"
                variant="subtle"
                leftSection={<IconPlus size={12} />}
                type="button"
                onClick={() => setPorts((prev) => [...prev, emptyPort()])}
              >
                Add port
              </Button>
            </Group>
            {ports.map((port, idx) => (
              <Paper key={idx} withBorder p="xs" radius="sm">
                <Group align="flex-end" gap="xs" wrap="nowrap">
                  <SimpleGrid cols={showNodePort ? 5 : 4} style={{ flex: 1 }}>
                    <TextInput
                      label="Name"
                      placeholder="http"
                      size="xs"
                      value={port.name}
                      onChange={(e) => updatePort(idx, "name", e.currentTarget.value)}
                    />
                    <Select
                      label="Protocol"
                      data={PROTOCOLS}
                      size="xs"
                      value={port.protocol}
                      onChange={(v) => updatePort(idx, "protocol", v ?? "TCP")}
                      allowDeselect={false}
                    />
                    <TextInput
                      label="Port"
                      placeholder="80"
                      size="xs"
                      value={port.port}
                      onChange={(e) => updatePort(idx, "port", e.currentTarget.value)}
                    />
                    <TextInput
                      label="Target Port"
                      placeholder="8080"
                      size="xs"
                      value={port.targetPort}
                      onChange={(e) => updatePort(idx, "targetPort", e.currentTarget.value)}
                    />
                    {showNodePort && (
                      <TextInput
                        label="Node Port"
                        placeholder="30080"
                        size="xs"
                        value={port.nodePort}
                        onChange={(e) => updatePort(idx, "nodePort", e.currentTarget.value)}
                      />
                    )}
                  </SimpleGrid>
                  <ActionIcon
                    color="danger"
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => setPorts((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={ports.length === 1}
                    mb={1}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
