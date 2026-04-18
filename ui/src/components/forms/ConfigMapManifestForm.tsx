import { useEffect, useState } from "react";
import { Box, Checkbox, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import type { CreateConfigMapRequest } from "../../types";
import {
  type KeyValuePair,
  KeyValuePairsField,
  pairsToRecord,
  validatePairs,
} from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

function recordToPairs(record?: Record<string, string>): KeyValuePair[] {
  return record ? Object.entries(record).map(([key, value]) => ({ key, value })) : [];
}

export function ConfigMapManifestForm({
  formId,
  onSubmit,
  onPayloadChange,
  defaultPayload,
}: {
  formId?: string;
  onSubmit: (payload: CreateConfigMapRequest) => void;
  onPayloadChange?: (payload: CreateConfigMapRequest) => void;
  defaultPayload?: Partial<CreateConfigMapRequest>;
}) {
  const [labelPairs, setLabelPairs] = useState<KeyValuePair[]>(() =>
    recordToPairs(defaultPayload?.labels),
  );
  const [annotationPairs, setAnnotationPairs] = useState<KeyValuePair[]>(() =>
    recordToPairs(defaultPayload?.annotations),
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

  useEffect(() => {
    onPayloadChange?.({
      ...form.values,
      labels: pairsToRecord(labelPairs),
      annotations: pairsToRecord(annotationPairs),
      data: pairsToRecord(dataPairs),
      binaryData: pairsToRecord(binaryDataPairs),
    });
  }, [form.values.name, form.values.namespace, form.values.immutable, labelPairs, annotationPairs, dataPairs, binaryDataPairs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formResult = form.validate();
    const labelsError = validatePairs(labelPairs, "Labels");
    const annotationsError = validatePairs(annotationPairs, "Annotations");
    const dataError = validatePairs(dataPairs, "Data");
    const binaryDataError = validatePairs(binaryDataPairs, "Binary data");

    if (formResult.hasErrors || labelsError || annotationsError || dataError || binaryDataError) {
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
      labels: pairsToRecord(labelPairs),
      annotations: pairsToRecord(annotationPairs),
      data: pairsToRecord(dataPairs),
      binaryData: pairsToRecord(binaryDataPairs),
    });
  };

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} px="lg" py="md">
      <Stack gap="md">
        <MetadataFields
          form={form}
          labelPairs={labelPairs}
          annotationPairs={annotationPairs}
          onLabelsChange={(pairs) => {
            setLabelPairs(pairs);
            setPairErrors((prev) => ({ ...prev, labels: undefined }));
          }}
          onAnnotationsChange={(pairs) => {
            setAnnotationPairs(pairs);
            setPairErrors((prev) => ({ ...prev, annotations: undefined }));
          }}
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
