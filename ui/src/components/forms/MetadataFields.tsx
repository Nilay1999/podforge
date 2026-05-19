import { Paper, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { DEFAULT_NAMESPACES } from "@src/utils/constants";
import { type KeyValuePair, UncontrolledKeyValuePairs } from "./KeyValuePairsField";

interface MetadataFieldsProps<T extends { name: string; namespace: string }> {
  form: UseFormReturnType<T>;
  initialLabels?: KeyValuePair[];
  initialAnnotations?: KeyValuePair[];
  registerLabels: (fn: (() => KeyValuePair[]) | null) => void;
  registerAnnotations: (fn: (() => KeyValuePair[]) | null) => void;
  labelError?: string;
  annotationError?: string;
  namePlaceholder?: string;
}

export function MetadataFields<T extends { name: string; namespace: string }>({
  form,
  initialLabels,
  initialAnnotations,
  registerLabels,
  registerAnnotations,
  labelError,
  annotationError,
  namePlaceholder = "my-resource"
}: MetadataFieldsProps<T>) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>Metadata</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Name"
            placeholder={namePlaceholder}
            withAsterisk
            key={form.key("name")}
            {...form.getInputProps("name")}
          />
          <Select
            label="Namespace"
            data={DEFAULT_NAMESPACES}
            searchable
            allowDeselect={false}
            placeholder="default"
            key={form.key("namespace")}
            {...form.getInputProps("namespace")}
          />
        </SimpleGrid>

        <UncontrolledKeyValuePairs
          label="Labels"
          description="Key/value pairs"
          initial={initialLabels}
          register={registerLabels}
          error={labelError}
          keyPlaceholder="app"
          valuePlaceholder="myapp"
        />

        <UncontrolledKeyValuePairs
          label="Annotations"
          description="Key/value pairs"
          initial={initialAnnotations}
          register={registerAnnotations}
          error={annotationError}
          keyPlaceholder="example.com/foo"
          valuePlaceholder="bar"
        />
      </Stack>
    </Paper>
  );
}
