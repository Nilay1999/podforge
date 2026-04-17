import { useState } from "react";
import { Box, Checkbox, Paper, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { CreateConfigMapRequest } from "../../types";
import {
  type KeyValuePair,
  KeyValuePairsField,
  pairsToRecord,
  validatePairs,
} from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

export function ConfigMapManifestForm({
  formId,
  onSubmit,
}: {
  formId?: string;
  onSubmit?: (payload: CreateConfigMapRequest) => void;
}) {
  const [labelPairs, setLabelPairs] = useState<KeyValuePair[]>([]);
  const [annotationPairs, setAnnotationPairs] = useState<KeyValuePair[]>([]);
  const [dataPairs, setDataPairs] = useState<KeyValuePair[]>([]);
  const [pairErrors, setPairErrors] = useState<{
    labels?: string;
    annotations?: string;
    data?: string;
  }>({});

  const form = useForm<CreateConfigMapRequest>({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      namespace: "default",
      immutable: false,
    },
    validate: (values) => {
      const errors: Partial<Record<string, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      return errors;
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formResult = form.validate();
    const labelsError = validatePairs(labelPairs, "Labels");
    const annotationsError = validatePairs(annotationPairs, "Annotations");
    const dataError = validatePairs(dataPairs, "Data");
    if (formResult.hasErrors || labelsError || annotationsError || dataError) {
      setPairErrors({
        labels: labelsError,
        annotations: annotationsError,
        data: dataError,
      });
      return;
    }
    setPairErrors({});
    onSubmit?.({
      ...form.getValues(),
      labels: pairsToRecord(labelPairs),
      annotations: pairsToRecord(annotationPairs),
      data: pairsToRecord(dataPairs),
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
              description="Key/value pairs"
              pairs={dataPairs}
              onChange={(pairs) => {
                setDataPairs(pairs);
                setPairErrors((prev) => ({ ...prev, data: undefined }));
              }}
              error={pairErrors.data}
              keyPlaceholder="FOO"
              valuePlaceholder="bar"
            />
            <Checkbox
              label="Immutable"
              key={form.key("immutable")}
              {...form.getInputProps("immutable", { type: "checkbox" })}
            />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
