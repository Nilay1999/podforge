import {
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { DEFAULT_NAMESPACES } from "../../utils/constants";
import { KeyValuePairsField, type KeyValuePair } from "./KeyValuePairsField";

interface MetadataFieldsProps<T extends { name: string; namespace: string }> {
  form: UseFormReturnType<T>;
  labelPairs: KeyValuePair[];
  annotationPairs: KeyValuePair[];
  onLabelsChange: (pairs: KeyValuePair[]) => void;
  onAnnotationsChange: (pairs: KeyValuePair[]) => void;
  labelError?: string;
  annotationError?: string;
  namePlaceholder?: string;
}

export function MetadataFields<T extends { name: string; namespace: string }>({
  form,
  labelPairs,
  annotationPairs,
  onLabelsChange,
  onAnnotationsChange,
  labelError,
  annotationError,
  namePlaceholder = "my-resource",
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

        <KeyValuePairsField
          label="Labels"
          description="Key/value pairs"
          pairs={labelPairs}
          onChange={onLabelsChange}
          error={labelError}
          keyPlaceholder="app"
          valuePlaceholder="myapp"
        />

        <KeyValuePairsField
          label="Annotations"
          description="Key/value pairs"
          pairs={annotationPairs}
          onChange={onAnnotationsChange}
          error={annotationError}
          keyPlaceholder="example.com/foo"
          valuePlaceholder="bar"
        />
      </Stack>
    </Paper>
  );
}
