import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { KIND_STRATEGIES, type AnyPayload } from "@src/components/manifest/kindStrategies";
import type { ObjectMeta, ResourceKind } from "@src/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UpdateFn = (namespace: string, name: string, payload: any) => Promise<unknown>;

export function useEditManifestDrawer<T extends { metadata: ObjectMeta }>(
  kind: ResourceKind,
  updateFn: UpdateFn,
  queryKey: string
) {
  const qc = useQueryClient();
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] = useDisclosure(false);

  const handleEditItem = (item: T) => {
    setEditingItem(item);
    openEditDrawer();
  };

  const handleEditApply = (
    payload: AnyPayload,
    opts: { onSuccess: () => void; onError: (err: Error) => void }
  ) => {
    if (!editingItem) return;
    const { namespace = "default", name } = editingItem.metadata;
    updateFn(namespace, name, payload)
      .then(() => {
        qc.invalidateQueries({ queryKey: [queryKey] });
        opts.onSuccess();
      })
      .catch(opts.onError);
  };

  const editInitialPayload = editingItem
    ? KIND_STRATEGIES[kind].fromManifest(editingItem)
    : undefined;

  return { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload };
}
