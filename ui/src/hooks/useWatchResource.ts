import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ObjectMeta } from "@src/types";

export function useWatchResource<T extends { metadata: ObjectMeta }>(
  resource: string,
  namespace: string,
) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`/api/v1/watch/${resource}/${namespace}`);

    const prefix = resource.endsWith("s") ? resource.slice(0, -1) : resource;
    const listKey = [resource, "list", namespace];

    const patch = (
      updater: (old: { items: T[] } | undefined) => { items: T[] },
    ) => queryClient.setQueryData<{ items: T[] }>(listKey, updater);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener(`${prefix}_added`, (e: MessageEvent) => {
      const item: T = JSON.parse(e.data);
      patch((old) => {
        if (!old) return { items: [item] };
        if (old.items.some((i) => i.metadata.name === item.metadata.name))
          return old;
        return { items: [...old.items, item] };
      });
    });

    es.addEventListener(`${prefix}_modified`, (e: MessageEvent) => {
      const item: T = JSON.parse(e.data);
      patch((old) => {
        if (!old) return { items: [item] };
        return {
          items: old.items.map((i) =>
            i.metadata.name === item.metadata.name ? item : i,
          ),
        };
      });
    });

    es.addEventListener(`${prefix}_deleted`, (e: MessageEvent) => {
      const item: T = JSON.parse(e.data);
      patch((old) => {
        if (!old) return { items: [] };
        return {
          items: old.items.filter(
            (i) => i.metadata.name !== item.metadata.name,
          ),
        };
      });
    });

    return () => {
      es.close();
      setConnected(false);
    };
  }, [resource, namespace, queryClient]);

  return { connected };
}
