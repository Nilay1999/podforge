import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Checkbox, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import type { CreateConfigMapRequest } from "@src/types";
import {
  type KeyValuePair,
  KeyValuePairsField,
  pairsToRecord,
  validatePairs,
} from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

function recordToPairs(record?: Record<string, string>): KeyValuePair[] {
  return record
    ? Object.entries(record).map(([key, value]) => ({ key, value }))
    : [];
}

export function ConfigMapManifestForm({
  formId,
  onSubmit,
  registerGetPayload,
  defaultPayload,
}: {
  formId?: string;
  onSubmit: (payload: CreateConfigMapRequest) => void;
  registerGetPayload?: (fn: (() => CreateConfigMapRequest) | null) => void;
  defaultPayload?: Partial<CreateConfigMapRequest>;
}) {
  const emptyPairs = useRef<() => KeyValuePair[]>(() => []).current;
  const labelsGetter = useRef<() => KeyValuePair[]>(emptyPairs);
  const annotationsGetter = useRef<() => KeyValuePair[]>(emptyPairs);

  const registerLabels = useCallback(
    (fn: (() => KeyValuePair[]) | null) => {
      labelsGetter.current = fn ?? emptyPairs;
    },
    [emptyPairs],
  );
  const registerAnnotations = useCallback(
    (fn: (() => KeyValuePair[]) | null) => {
      annotationsGetter.current = fn ?? emptyPairs;
    },
    [emptyPairs],
  );

  const [dataPairs, setDataPairs] = useState<KeyValuePair[]>(() =>
    recordToPairs(defaultPayload?.data),
  );
  const [binaryDataPairs, setBinaryDataPairs] = useState<KeyValuePair[]>(() =>
    recordToPairs(defaultPayload?.binaryData),
  );
  const [pairErrors, setPairErrors] = useState<{
    labels?: string;
    annotations?: string;
    data?: string;
    binaryData?: string;
  }>({});

  const form = useForm<CreateConfigMapRequest>({
    mode: "uncontrolled",
    initialValues: {
      name: defaultPayload?.name ?? "",
      namespace: defaultPayload?.namespace ?? "default",
      immutable: defaultPayload?.immutable ?? false,
    },
    validate: (values) => {
      const errors: Partial<Record<string, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      return errors;
    },
  });

  const buildPayload = (): CreateConfigMapRequest => ({
    ...form.getValues(),
    labels: pairsToRecord(labelsGetter.current()),
    annotations: pairsToRecord(annotationsGetter.current()),
    data: pairsToRecord(dataPairs),
    binaryData: pairsToRecord(binaryDataPairs),
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
    const labelsError = validatePairs(labelsGetter.current(), "Labels");
    const annotationsError = validatePairs(annotationsGetter.current(), "Annotations");
    const dataError = validatePairs(dataPairs, "Data");
    const binaryDataError = validatePairs(binaryDataPairs, "Binary data");

    if (
      formResult.hasErrors ||
      labelsError ||
      annotationsError ||
      dataError ||
      binaryDataError
    ) {
      setPairErrors({
        labels: labelsError,
        annotations: annotationsError,
        data: dataError,
        binaryData: binaryDataError,
      });
      return;
    }
    setPairErrors({});
    onSubmit({
      ...form.getValues(),
      labels: pairsToRecord(labelsGetter.current()),
      annotations: pairsToRecord(annotationsGetter.current()),
      data: pairsToRecord(dataPairs),
      binaryData: pairsToRecord(binaryDataPairs),
    });
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
          labelError={pairErrors.labels}
          annotationError={pairErrors.annotations}
          namePlaceholder="my-config"
        />

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Data</Text>
            <KeyValuePairsField
              label="Data"
              description="Plain text key/value pairs"
              pairs={dataPairs}
              onChange={(pairs) => {
                setDataPairs(pairs);
                setPairErrors((prev) => ({ ...prev, data: undefined }));
              }}
              error={pairErrors.data}
              keyPlaceholder="APP_ENV"
              valuePlaceholder="production"
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Tooltip
              label="Values must be base64-encoded strings (e.g. dXNlcjpwYXNz)"
              position="right"
              withArrow
            >
              <Text fw={600} style={{ width: "fit-content", cursor: "help" }}>
                Binary Data{" "}
                <IconInfoCircle
                  size={14}
                  style={{ verticalAlign: "middle", opacity: 0.6 }}
                />
              </Text>
            </Tooltip>
            <KeyValuePairsField
              label="Binary Data"
              description="Values must be base64-encoded"
              pairs={binaryDataPairs}
              onChange={(pairs) => {
                setBinaryDataPairs(pairs);
                setPairErrors((prev) => ({ ...prev, binaryData: undefined }));
              }}
              error={pairErrors.binaryData}
              keyPlaceholder="tls.crt"
              valuePlaceholder="LS0tLS1CRUdJTi..."
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="xs">
            <Text fw={600}>Configuration</Text>
            <Checkbox
              label="Immutable"
              description="Prevents future updates to data or binaryData. Can only be undone by deleting and recreating the ConfigMap."
              key={form.key("immutable")}
              {...form.getInputProps("immutable", { type: "checkbox" })}
            />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
