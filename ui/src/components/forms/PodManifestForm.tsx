import { useCallback, useEffect, useRef, useState } from "react";
import { Box, NumberInput, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { CreatePodRequest } from "@src/types";
import { type KeyValuePair, pairsToRecord, validatePairs } from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

export function PodManifestForm({
  formId,
  onSubmit,
  registerGetPayload,
  defaultPayload
}: {
  formId?: string;
  onSubmit?: (payload: CreatePodRequest) => void;
  registerGetPayload?: (fn: (() => CreatePodRequest) | null) => void;
  defaultPayload?: Partial<CreatePodRequest>;
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

  const [pairErrors, setPairErrors] = useState<{
    labels?: string;
    annotations?: string;
  }>({});

  const form = useForm<CreatePodRequest>({
    mode: "uncontrolled",
    initialValues: {
      name: defaultPayload?.name ?? "",
      namespace: defaultPayload?.namespace ?? "default",
      containers: defaultPayload?.containers?.length
        ? defaultPayload.containers
        : [{ name: "main", image: "", ports: [{ containerPort: 80 }] }]
    },
    validate: (values) => {
      const errors: Partial<Record<string, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.containers?.[0]?.image?.trim())
        errors["containers.0.image"] = "Image is required";
      return errors;
    }
  });

  const buildPayload = (): CreatePodRequest => ({
    ...form.getValues(),
    labels: pairsToRecord(labelsGetter.current()),
    annotations: pairsToRecord(annotationsGetter.current())
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
    if (formResult.hasErrors || labelsError || annotationsError) {
      setPairErrors({ labels: labelsError, annotations: annotationsError });
      return;
    }
    setPairErrors({});
    onSubmit?.({
      ...form.getValues(),
      labels: pairsToRecord(labelsGetter.current()),
      annotations: pairsToRecord(annotationsGetter.current())
    });
  };

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} px="lg" py="md">
      <Stack gap="md">
        <MetadataFields
          form={form}
          initialLabels={
            defaultPayload?.labels
              ? Object.entries(defaultPayload.labels).map(([key, value]) => ({ key, value }))
              : undefined
          }
          initialAnnotations={
            defaultPayload?.annotations
              ? Object.entries(defaultPayload.annotations).map(([key, value]) => ({ key, value }))
              : undefined
          }
          registerLabels={registerLabels}
          registerAnnotations={registerAnnotations}
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
