import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

export type KeyValuePair = { key: string; value: string };

export const pairsToRecord = (pairs: KeyValuePair[]) => {
  const record: Record<string, string> = {};
  for (const { key, value } of pairs) {
    const k = key.trim();
    if (!k) continue;
    record[k] = typeof value === "string" ? value : String(value);
  }
  return Object.keys(record).length > 0 ? record : undefined;
};

export const validatePairs = (pairs: KeyValuePair[], label: string) => {
  const keys = new Set<string>();
  for (const { key, value } of pairs) {
    const k = key.trim();
    const v = typeof value === "string" ? value : String(value);
    if (!k && !v) continue;
    if (!k) return `${label}: key is required`;
    if (keys.has(k)) return `${label}: duplicate key "${k}"`;
    keys.add(k);
  }
  return undefined;
};

export function KeyValuePairsField({
  label,
  description,
  pairs,
  onChange,
  error,
  keyPlaceholder = "key",
  valuePlaceholder = "value"
}: {
  label: string;
  description?: string;
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  error?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text fw={500} size="sm">
            {label}
          </Text>
          {description && (
            <Text c="dimmed" size="xs">
              {description}
            </Text>
          )}
        </Stack>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={14} />}
          type="button"
          onClick={() => onChange([...pairs, { key: "", value: "" }])}
        >
          Add
        </Button>
      </Group>

      {error && (
        <Text c="danger" size="xs">
          {error}
        </Text>
      )}

      {pairs.length === 0 ? (
        <Text c="dimmed" size="sm">
          None
        </Text>
      ) : (
        <Stack gap="xs">
          {pairs.map((pair, index) => (
            <Group key={`${label}-${index}`} align="flex-end" gap="xs" wrap="nowrap">
              <TextInput
                label={index === 0 ? "Key" : undefined}
                placeholder={keyPlaceholder}
                style={{ flex: 1 }}
                value={pair.key}
                onChange={(e) => {
                  onChange(
                    pairs.map((p, i) => (i === index ? { ...p, key: e.currentTarget.value } : p))
                  );
                }}
              />
              <TextInput
                label={index === 0 ? "Value" : undefined}
                placeholder={valuePlaceholder}
                style={{ flex: 1 }}
                value={pair.value}
                onChange={(e) => {
                  onChange(
                    pairs.map((p, i) => (i === index ? { ...p, value: e.currentTarget.value } : p))
                  );
                }}
              />
              <ActionIcon
                aria-label={`Remove ${label}`}
                variant="subtle"
                color="danger"
                type="button"
                onClick={() => onChange(pairs.filter((_, i) => i !== index))}
                mb={index === 0 ? 2 : 0}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function UncontrolledKeyValuePairs({
  label,
  description,
  initial,
  register,
  error,
  keyPlaceholder,
  valuePlaceholder
}: {
  label: string;
  description?: string;
  initial?: KeyValuePair[];
  register: (fn: (() => KeyValuePair[]) | null) => void;
  error?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => initial ?? []);
  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;

  useEffect(() => {
    register(() => pairsRef.current);
    return () => register(null);
  }, [register]);

  return (
    <KeyValuePairsField
      label={label}
      description={description}
      pairs={pairs}
      onChange={setPairs}
      error={error}
      keyPlaceholder={keyPlaceholder}
      valuePlaceholder={valuePlaceholder}
    />
  );
}
