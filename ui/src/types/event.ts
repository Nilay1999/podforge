import type { ObjectMeta } from "./shared";

export type EventSeverity = "Normal" | "Warning";

export interface EventInvolvedObject {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  fieldPath?: string;
}

export interface EventSource {
  component?: string;
  host?: string;
}

export interface ClusterEvent {
  metadata: ObjectMeta;
  involvedObject?: EventInvolvedObject;
  reason?: string;
  message?: string;
  source?: EventSource;
  firstTimestamp?: string | null;
  lastTimestamp?: string | null;
  eventTime?: string | null;
  count?: number;
  type?: EventSeverity;
}

export function eventTimestamp(e: ClusterEvent): string | undefined {
  return (
    e.lastTimestamp ??
    e.eventTime ??
    e.firstTimestamp ??
    e.metadata.creationTimestamp ??
    undefined
  );
}
