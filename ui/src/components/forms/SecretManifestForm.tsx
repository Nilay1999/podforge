import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Checkbox, Paper, Select, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { CreateSecretRequest } from "@src/types";
import { type KeyValuePair, KeyValuePairsField, pairsToRecord, validatePairs } from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

function recordToPairs(record?: Record<string, string>): KeyValuePair[] {
  return record ? Object.entries(record).map(([key, value]) => ({ key, value })) : [];
}

const SECRET_TYPES = [
  "Opaque",
  "kubernetes.io/service-account-token",
  "kubernetes.io/dockerconfigjson",
  "kubernetes.io/dockercfg",
  "kubernetes.io/basic-auth",
  "kubernetes.io/ssh-auth",
  "kubernetes.io/tls",
  "bootstrap.kubernetes.io/token"
];

export function SecretManifestForm({
  formId,
  onSubmit,
  registerGetPayload,
  defaultPayload
}: {
  formId?: string;
  onSubmit: (payload: CreateSecretRequest) => void;
  registerGetPayload?: (fn: (() => CreateSecretRequest) | null) => void;
  defaultPayload?: Partial<CreateSecretRequest>;
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

  const [stringDataPairs, setStringDataPairs] = useState<KeyValuePair[]>(() =>
    recordToPairs(defaultPayload?.stringData)
  );
  const [stringDataError, setStringDataError] = useState<string | undefined>();

  const form = useForm<CreateSecretRequest>({
    mode: "uncontrolled",
    initialValues: {
      name: defaultPayload?.name ?? "",
      namespace: defaultPayload?.namespace ?? "default",
      type: defaultPayload?.type ?? "Opaque",
      immutable: defaultPayload?.immutable ?? false
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name?.trim()) errors.name = "Name is required";
      return errors;
    }
  });

  const buildPayload = (): CreateSecretRequest => ({
    ...form.getValues(),
    labels: pairsToRecord(labelsGetter.current()),
    annotations: pairsToRecord(annotationsGetter.current()),
    stringData: pairsToRecord(stringDataPairs)
  });

  const buildPayloadRef = useRef(buildPayload);
  buildPayloadRef.current = buildPayload;

  useEffect(() => {
    registerGetPayload?.(() => buildPayloadRef.current());
    return () => registerGetPayload?.(null);
  }, [registerGetPayload]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formResult = form.validate();
    const sdErr = validatePairs(stringDataPairs, "String data");
    if (formResult.hasErrors || sdErr) {
      setStringDataError(sdErr);
      return;
    }
    setStringDataError(undefined);
    onSubmit(buildPayload());
  };

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} px="lg" py="md">
      <Stack gap="md">
        <MetadataFields
          form={form}
          initialLabels={recordToPairs(defaultPayload?.labels)}
          initialAnnotations={recordToPairs(defaultPayload?.annotations)}
          registerLabels={registerLabels}
          registerAnnotations={registerAnnotations}
          namePlaceholder="my-secret"
        />

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Secret</Text>
            <Select
              label="Type"
              data={SECRET_TYPES}
              allowDeselect={false}
              key={form.key("type")}
              {...form.getInputProps("type")}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Data</Text>
            <KeyValuePairsField
              label="String Data"
              description="Plain text key/value pairs (stored encoded in the cluster)"
              pairs={stringDataPairs}
              onChange={(pairs) => {
                setStringDataPairs(pairs);
                setStringDataError(undefined);
              }}
              error={stringDataError}
              keyPlaceholder="username"
              valuePlaceholder="admin"
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="xs">
            <Text fw={600}>Configuration</Text>
            <Checkbox
              label="Immutable"
              description="Prevents future updates to data. Can only be undone by deleting and recreating the Secret."
              key={form.key("immutable")}
              {...form.getInputProps("immutable", { type: "checkbox" })}
            />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
