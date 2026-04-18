import { useState } from "react";
import { Box, NumberInput, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { CreatePodRequest } from "@src/types";
import {
  type KeyValuePair,
  pairsToRecord,
  validatePairs,
} from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

export function PodManifestForm({
  formId,
  onSubmit,
}: {
  formId?: string;
  onSubmit?: (payload: CreatePodRequest) => void;
}) {
  const [labelPairs, setLabelPairs] = useState<KeyValuePair[]>([]);
  const [annotationPairs, setAnnotationPairs] = useState<KeyValuePair[]>([]);
  const [pairErrors, setPairErrors] = useState<{
    labels?: string;
    annotations?: string;
  }>({});

  const form = useForm<CreatePodRequest>({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      namespace: "default",
      containers: [{ name: "main", image: "", ports: [{ containerPort: 80 }] }],
    },
    validate: (values) => {
      const errors: Partial<Record<string, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.containers?.[0]?.image?.trim())
        errors["containers.0.image"] = "Image is required";
      return errors;
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formResult = form.validate();
    const labelsError = validatePairs(labelPairs, "Labels");
    const annotationsError = validatePairs(annotationPairs, "Annotations");
    if (formResult.hasErrors || labelsError || annotationsError) {
      setPairErrors({ labels: labelsError, annotations: annotationsError });
      return;
    }
    setPairErrors({});
    onSubmit?.({
      ...form.getValues(),
      labels: pairsToRecord(labelPairs),
      annotations: pairsToRecord(annotationPairs),
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
          namePlaceholder="my-pod"
        />

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Container</Text>
            <TextInput
              label="Image"
              placeholder="nginx:latest"
              withAsterisk
              key={form.key("containers.0.image")}
              {...form.getInputProps("containers.0.image")}
            />
            <NumberInput
              label="Container port"
              min={1}
              max={65535}
              clampBehavior="strict"
              key={form.key("containers.0.ports.0.containerPort")}
              {...form.getInputProps("containers.0.ports.0.containerPort")}
            />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
