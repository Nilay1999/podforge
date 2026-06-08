import { useEffect, useRef, useState } from "react";
import type { ClusterEvent } from "@src/types";
import { eventTimestamp } from "@src/types";

const MAX_EVENTS = 500;

interface WatchEnvelope {
  type: "ADDED" | "MODIFIED" | "DELETED";
  object: ClusterEvent;
}

function sortByRecency(events: ClusterEvent[]): ClusterEvent[] {
  return [...events].sort((a, b) => {
    const ta = eventTimestamp(a) ?? "";
    const tb = eventTimestamp(b) ?? "";
    return tb.localeCompare(ta);
  });
}

export function useClusterEvents(namespace: string, paused: boolean) {
  const [events, setEvents] = useState<ClusterEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    setEvents([]);

    const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : "";
    const es = new EventSource(`/api/v1/events/stream${query}`);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("k8s_event", (e: MessageEvent) => {
      if (pausedRef.current) return;

      const { type, object }: WatchEnvelope = JSON.parse(e.data);
      const uid = object.metadata.uid;
      if (!uid) return;

      setEvents((prev) => {
        if (type === "DELETED") {
          return prev.filter((ev) => ev.metadata.uid !== uid);
        }
        const without = prev.filter((ev) => ev.metadata.uid !== uid);
        return sortByRecency([object, ...without]).slice(0, MAX_EVENTS);
      });
    });

    return () => {
      es.close();
      setConnected(false);
    };
  }, [namespace]);

  const clear = () => setEvents([]);

  return { events, connected, clear };
}
