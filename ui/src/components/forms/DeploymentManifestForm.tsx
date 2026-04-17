import { useState } from "react";
import {
  Box,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type { CreateDeploymentRequest } from "../../types";
import {
  type KeyValuePair,
  pairsToRecord,
  validatePairs,
} from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

export function DeploymentManifestForm({
  formId,
  onSubmit,
}: {
  formId?: string;
  onSubmit?: (payload: CreateDeploymentRequest) => void;
}) {
  const [labelPairs, setLabelPairs] = useState<KeyValuePair[]>([]);
  const [annotationPairs, setAnnotationPairs] = useState<KeyValuePair[]>([]);
  const [pairErrors, setPairErrors] = useState<{
    labels?: string;
    annotations?: string;
  }>({});

  const form = useForm<CreateDeploymentRequest>({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      namespace: "default",
      image: "",
      replicas: 1,
      ports: [{ containerPort: 80 }],
    },
    validate: (values) => {
      const errors: Partial<Record<string, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.image.trim()) errors.image = "Image is required";
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
          namePlaceholder="my-deployment"
        />

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Deployment</Text>
            <TextInput
              label="Image"
              placeholder="nginx:latest"
              withAsterisk
              key={form.key("image")}
              {...form.getInputProps("image")}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <NumberInput
                label="Replicas"
                min={0}
                clampBehavior="strict"
                key={form.key("replicas")}
                {...form.getInputProps("replicas")}
              />
              <NumberInput
                label="Container port"
                min={1}
                max={65535}
                clampBehavior="strict"
                key={form.key("ports.0.containerPort")}
                {...form.getInputProps("ports.0.containerPort")}
              />
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
