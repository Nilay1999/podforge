import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Tooltip
} from "@mantine/core";
import { useForm, type UseFormReturnType } from "@mantine/form";
import { IconInfoCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import type {
  ContainerPort,
  CreateDeploymentRequest,
  DNSPolicy,
  EnvFrom,
  ImagePullPolicy,
  Probe,
  Toleration
} from "@src/types";
import {
  type KeyValuePair,
  pairsToRecord,
  UncontrolledKeyValuePairs,
  validatePairs
} from "./KeyValuePairsField";
import { MetadataFields } from "./MetadataFields";

type ProbeType = "none" | "httpGet" | "exec" | "tcpSocket";

interface ProbeState {
  type: ProbeType;
  httpPath: string;
  httpPort: number;
  execCommand: string[];
  tcpPort: number;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  failureThreshold?: number;
  successThreshold?: number;
}

function defaultProbeState(): ProbeState {
  return {
    type: "none",
    httpPath: "/",
    httpPort: 8080,
    execCommand: [],
    tcpPort: 8080
  };
}

function probeToState(p?: Probe): ProbeState {
  if (!p) return defaultProbeState();
  return {
    type: p.httpGet ? "httpGet" : p.exec ? "exec" : p.tcpSocket ? "tcpSocket" : "none",
    httpPath: p.httpGet?.path ?? "/",
    httpPort: p.httpGet?.port ?? 8080,
    execCommand: p.exec?.command ?? [],
    tcpPort: p.tcpSocket?.port ?? 8080,
    initialDelaySeconds: p.initialDelaySeconds,
    periodSeconds: p.periodSeconds,
    timeoutSeconds: p.timeoutSeconds,
    failureThreshold: p.failureThreshold,
    successThreshold: p.successThreshold
  };
}

function stateToProbe(s: ProbeState): Probe | undefined {
  if (s.type === "none") return undefined;
  return {
    ...(s.type === "httpGet" ? { httpGet: { path: s.httpPath, port: s.httpPort } } : {}),
    ...(s.type === "exec" ? { exec: { command: s.execCommand } } : {}),
    ...(s.type === "tcpSocket" ? { tcpSocket: { port: s.tcpPort } } : {}),
    ...(s.initialDelaySeconds != null ? { initialDelaySeconds: s.initialDelaySeconds } : {}),
    ...(s.periodSeconds != null ? { periodSeconds: s.periodSeconds } : {}),
    ...(s.timeoutSeconds != null ? { timeoutSeconds: s.timeoutSeconds } : {}),
    ...(s.failureThreshold != null ? { failureThreshold: s.failureThreshold } : {}),
    ...(s.successThreshold != null ? { successThreshold: s.successThreshold } : {})
  };
}

function ProbeSection({
  label,
  state,
  onChange
}: {
  label: string;
  state: ProbeState;
  onChange: (s: ProbeState) => void;
}) {
  const set = (patch: Partial<ProbeState>) => onChange({ ...state, ...patch });
  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">
        {label}
      </Text>
      <Select
        size="sm"
        data={[
          { label: "None", value: "none" },
          { label: "HTTP GET", value: "httpGet" },
          { label: "Exec", value: "exec" },
          { label: "TCP Socket", value: "tcpSocket" }
        ]}
        value={state.type}
        onChange={(v) => set({ type: (v ?? "none") as ProbeType })}
      />
      {state.type === "httpGet" && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Path"
            size="sm"
            value={state.httpPath}
            onChange={(e) => set({ httpPath: e.currentTarget.value })}
          />
          <NumberInput
            label="Port"
            size="sm"
            min={1}
            max={65535}
            value={state.httpPort}
            onChange={(v) => set({ httpPort: Number(v) || 8080 })}
          />
        </SimpleGrid>
      )}
      {state.type === "exec" && (
        <TagsInput
          label="Command"
          size="sm"
          placeholder="Add token, press Enter"
          value={state.execCommand}
          onChange={(v) => set({ execCommand: v })}
        />
      )}
      {state.type === "tcpSocket" && (
        <NumberInput
          label="Port"
          size="sm"
          min={1}
          max={65535}
          value={state.tcpPort}
          onChange={(v) => set({ tcpPort: Number(v) || 8080 })}
        />
      )}
      {state.type !== "none" && (
        <SimpleGrid cols={{ base: 2, sm: 5 }}>
          <NumberInput
            label="Initial Delay (s)"
            size="sm"
            min={0}
            value={state.initialDelaySeconds ?? ""}
            onChange={(v) => set({ initialDelaySeconds: v !== "" ? Number(v) : undefined })}
          />
          <NumberInput
            label="Period (s)"
            size="sm"
            min={1}
            value={state.periodSeconds ?? ""}
            onChange={(v) => set({ periodSeconds: v !== "" ? Number(v) : undefined })}
          />
          <NumberInput
            label="Timeout (s)"
            size="sm"
            min={1}
            value={state.timeoutSeconds ?? ""}
            onChange={(v) => set({ timeoutSeconds: v !== "" ? Number(v) : undefined })}
          />
          <NumberInput
            label="Failure Threshold"
            size="sm"
            min={1}
            value={state.failureThreshold ?? ""}
            onChange={(v) => set({ failureThreshold: v !== "" ? Number(v) : undefined })}
          />
          <NumberInput
            label="Success Threshold"
            size="sm"
            min={1}
            value={state.successThreshold ?? ""}
            onChange={(v) => set({ successThreshold: v !== "" ? Number(v) : undefined })}
          />
        </SimpleGrid>
      )}
    </Stack>
  );
}

interface EnvFromEntry {
  refType: "configMap" | "secret";
  name: string;
  prefix: string;
}

function envFromToEntries(envFrom?: EnvFrom[]): EnvFromEntry[] {
  return (envFrom ?? []).map((e) => ({
    refType: e.configMapRef ? "configMap" : "secret",
    name: (e.configMapRef || e.secretRef) ?? "",
    prefix: e.prefix ?? ""
  }));
}

function entriesToEnvFrom(entries: EnvFromEntry[]): EnvFrom[] {
  return entries
    .filter((e) => e.name.trim())
    .map((e) => ({
      ...(e.refType === "configMap" ? { configMapRef: e.name } : { secretRef: e.name }),
      ...(e.prefix.trim() ? { prefix: e.prefix } : {})
    }));
}

function recordToPairs(record?: Record<string, string>): KeyValuePair[] {
  return record ? Object.entries(record).map(([key, value]) => ({ key, value })) : [];
}

const DNS_POLICY_OPTIONS: { label: string; value: DNSPolicy }[] = [
  { label: "ClusterFirst", value: "ClusterFirst" },
  { label: "ClusterFirst + HostNet", value: "ClusterFirstWithHostNet" },
  { label: "Default", value: "Default" },
  { label: "None", value: "None" }
];

const PULL_POLICY_OPTIONS: { label: string; value: ImagePullPolicy }[] = [
  { label: "IfNotPresent", value: "IfNotPresent" },
  { label: "Always", value: "Always" },
  { label: "Never", value: "Never" }
];

const PROTOCOL_OPTIONS = ["TCP", "UDP", "SCTP"].map((v) => ({
  label: v,
  value: v
}));

const TOLERATION_OPERATOR_OPTIONS = [
  { label: "Equal", value: "Equal" },
  { label: "Exists", value: "Exists" }
];

const TOLERATION_EFFECT_OPTIONS = [
  { label: "NoSchedule", value: "NoSchedule" },
  { label: "PreferNoSchedule", value: "PreferNoSchedule" },
  { label: "NoExecute", value: "NoExecute" }
];

export function DeploymentManifestForm({
  formId,
  onSubmit,
  registerGetPayload,
  defaultPayload
}: {
  formId?: string;
  onSubmit?: (payload: CreateDeploymentRequest) => void;
  registerGetPayload?: (fn: (() => CreateDeploymentRequest) | null) => void;
  defaultPayload?: Partial<CreateDeploymentRequest>;
}) {
  const d = defaultPayload;

  const initialLabels = recordToPairs(d?.labels);
  const initialAnnotations = recordToPairs(d?.annotations);
  const initialEnvVars = recordToPairs(d?.envVars);
  const initialNodeSelector = recordToPairs(d?.nodeSelector);

  const emptyPairs = useRef<() => KeyValuePair[]>(() => []).current;
  const labelsGetter = useRef<() => KeyValuePair[]>(emptyPairs);
  const annotationsGetter = useRef<() => KeyValuePair[]>(emptyPairs);
  const envVarsGetter = useRef<() => KeyValuePair[]>(emptyPairs);
  const nodeSelectGetter = useRef<() => KeyValuePair[]>(emptyPairs);

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
  const registerEnvVars = useCallback(
    (fn: (() => KeyValuePair[]) | null) => {
      envVarsGetter.current = fn ?? emptyPairs;
    },
    [emptyPairs]
  );
  const registerNodeSelect = useCallback(
    (fn: (() => KeyValuePair[]) | null) => {
      nodeSelectGetter.current = fn ?? emptyPairs;
    },
    [emptyPairs]
  );
  const [ports, setPorts] = useState<ContainerPort[]>(
    () => d?.ports ?? [{ containerPort: 80, protocol: "TCP" }]
  );
  const [envFromEntries, setEnvFromEntries] = useState<EnvFromEntry[]>(() =>
    envFromToEntries(d?.envFrom)
  );
  const [tolerations, setTolerations] = useState<Toleration[]>(() => d?.tolerations ?? []);
  const [livenessState, setLivenessState] = useState<ProbeState>(() =>
    probeToState(d?.livenessProbe)
  );
  const [readinessState, setReadinessState] = useState<ProbeState>(() =>
    probeToState(d?.readinessProbe)
  );
  const [startupState, setStartupState] = useState<ProbeState>(() => probeToState(d?.startupProbe));
  const [pairErrors, setPairErrors] = useState<{
    labels?: string;
    annotations?: string;
  }>({});

  const [strategyType, setStrategyType] = useState<"RollingUpdate" | "Recreate">(
    d?.strategy?.type ?? "RollingUpdate"
  );

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: d?.name ?? "",
      namespace: d?.namespace ?? "default",
      image: d?.image ?? "",
      imagePullPolicy: d?.imagePullPolicy as ImagePullPolicy | undefined,
      workingDir: d?.workingDir ?? "",
      command: d?.command ?? ([] as string[]),
      args: d?.args ?? ([] as string[]),
      imagePullSecrets: d?.imagePullSecrets ?? ([] as string[]),
      replicas: d?.replicas ?? 1,
      maxSurge: d?.strategy?.maxSurge ?? "",
      maxUnavailable: d?.strategy?.maxUnavailable ?? "",
      minReadySeconds: d?.minReadySeconds as number | undefined,
      revisionHistoryLimit: d?.revisionHistoryLimit as number | undefined,
      progressDeadlineSeconds: d?.progressDeadlineSeconds as number | undefined,
      serviceAccount: d?.serviceAccount ?? "",
      nodeName: d?.nodeName ?? "",
      dnsPolicy: d?.dnsPolicy as DNSPolicy | undefined,
      terminationGracePeriodSeconds: d?.terminationGracePeriodSeconds as number | undefined,
      priorityClassName: d?.priorityClassName ?? "",
      runtimeClassName: d?.runtimeClassName ?? "",
      requestsCpu: d?.resources?.requests?.cpu ?? "",
      requestsMemory: d?.resources?.requests?.memory ?? "",
      limitsCpu: d?.resources?.limits?.cpu ?? "",
      limitsMemory: d?.resources?.limits?.memory ?? "",
      cscRunAsUser: d?.containerSecurityContext?.runAsUser as number | undefined,
      cscRunAsGroup: d?.containerSecurityContext?.runAsGroup as number | undefined,
      cscRunAsNonRoot: d?.containerSecurityContext?.runAsNonRoot ?? false,
      cscReadOnly: d?.containerSecurityContext?.readOnlyRootFilesystem ?? false,
      cscNoPrivEsc: d?.containerSecurityContext?.allowPrivilegeEscalation === false,
      cscPrivileged: d?.containerSecurityContext?.privileged ?? false,
      pscRunAsUser: d?.podSecurityContext?.runAsUser as number | undefined,
      pscRunAsGroup: d?.podSecurityContext?.runAsGroup as number | undefined,
      pscRunAsNonRoot: d?.podSecurityContext?.runAsNonRoot ?? false,
      pscFsGroup: d?.podSecurityContext?.fsGroup as number | undefined
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.image.trim()) errors.image = "Image is required";
      return errors;
    }
  });

  function buildPayload(): CreateDeploymentRequest {
    const v = form.getValues();
    const labels = pairsToRecord(labelsGetter.current());
    const annotations = pairsToRecord(annotationsGetter.current());
    const envVars = pairsToRecord(envVarsGetter.current());
    const nodeSelector = pairsToRecord(nodeSelectGetter.current());

    const payload: CreateDeploymentRequest = {
      name: v.name,
      namespace: v.namespace,
      image: v.image,
      replicas: v.replicas
    };

    if (labels) payload.labels = labels;
    if (annotations) payload.annotations = annotations;
    if (v.imagePullPolicy) payload.imagePullPolicy = v.imagePullPolicy;
    if (v.command.length) payload.command = v.command;
    if (v.args.length) payload.args = v.args;
    if (v.workingDir.trim()) payload.workingDir = v.workingDir;
    if (ports.filter((p) => p.containerPort).length) payload.ports = ports;
    if (envVars) payload.envVars = envVars;

    const envFrom = entriesToEnvFrom(envFromEntries);
    if (envFrom.length) payload.envFrom = envFrom;

    const reqCpu = v.requestsCpu.trim();
    const reqMem = v.requestsMemory.trim();
    const limCpu = v.limitsCpu.trim();
    const limMem = v.limitsMemory.trim();
    if (reqCpu || reqMem || limCpu || limMem) {
      payload.resources = {};
      if (reqCpu || reqMem)
        payload.resources.requests = {
          ...(reqCpu ? { cpu: reqCpu } : {}),
          ...(reqMem ? { memory: reqMem } : {})
        };
      if (limCpu || limMem)
        payload.resources.limits = {
          ...(limCpu ? { cpu: limCpu } : {}),
          ...(limMem ? { memory: limMem } : {})
        };
    }

    const liveness = stateToProbe(livenessState);
    const readiness = stateToProbe(readinessState);
    const startup = stateToProbe(startupState);
    if (liveness) payload.livenessProbe = liveness;
    if (readiness) payload.readinessProbe = readiness;
    if (startup) payload.startupProbe = startup;

    payload.strategy = { type: strategyType };
    if (strategyType === "RollingUpdate") {
      if (v.maxSurge.trim()) payload.strategy.maxSurge = v.maxSurge;
      if (v.maxUnavailable.trim()) payload.strategy.maxUnavailable = v.maxUnavailable;
    }
    if (v.minReadySeconds != null) payload.minReadySeconds = v.minReadySeconds;
    if (v.revisionHistoryLimit != null) payload.revisionHistoryLimit = v.revisionHistoryLimit;
    if (v.progressDeadlineSeconds != null)
      payload.progressDeadlineSeconds = v.progressDeadlineSeconds;

    if (v.serviceAccount.trim()) payload.serviceAccount = v.serviceAccount;
    if (v.imagePullSecrets.length) payload.imagePullSecrets = v.imagePullSecrets;
    if (v.nodeName.trim()) payload.nodeName = v.nodeName;
    if (nodeSelector) payload.nodeSelector = nodeSelector;
    if (v.dnsPolicy) payload.dnsPolicy = v.dnsPolicy;
    if (v.terminationGracePeriodSeconds != null)
      payload.terminationGracePeriodSeconds = v.terminationGracePeriodSeconds;
    if (v.priorityClassName.trim()) payload.priorityClassName = v.priorityClassName;
    if (v.runtimeClassName.trim()) payload.runtimeClassName = v.runtimeClassName;

    if (
      v.cscRunAsUser != null ||
      v.cscRunAsGroup != null ||
      v.cscRunAsNonRoot ||
      v.cscReadOnly ||
      v.cscNoPrivEsc ||
      v.cscPrivileged
    ) {
      payload.containerSecurityContext = {
        ...(v.cscRunAsUser != null ? { runAsUser: v.cscRunAsUser } : {}),
        ...(v.cscRunAsGroup != null ? { runAsGroup: v.cscRunAsGroup } : {}),
        ...(v.cscRunAsNonRoot ? { runAsNonRoot: true } : {}),
        ...(v.cscReadOnly ? { readOnlyRootFilesystem: true } : {}),
        ...(v.cscNoPrivEsc ? { allowPrivilegeEscalation: false } : {}),
        ...(v.cscPrivileged ? { privileged: true } : {})
      };
    }

    if (
      v.pscRunAsUser != null ||
      v.pscRunAsGroup != null ||
      v.pscRunAsNonRoot ||
      v.pscFsGroup != null
    ) {
      payload.podSecurityContext = {
        ...(v.pscRunAsUser != null ? { runAsUser: v.pscRunAsUser } : {}),
        ...(v.pscRunAsGroup != null ? { runAsGroup: v.pscRunAsGroup } : {}),
        ...(v.pscRunAsNonRoot ? { runAsNonRoot: true } : {}),
        ...(v.pscFsGroup != null ? { fsGroup: v.pscFsGroup } : {})
      };
    }

    const validTolerations = tolerations.filter((t) => t.key || t.operator === "Exists");
    if (validTolerations.length) payload.tolerations = validTolerations;

    return payload;
  }

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
    onSubmit?.(buildPayload());
  };

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} px="lg" py="md">
      <Stack gap="md">
        <MetadataFields
          form={form as UseFormReturnType<{ name: string; namespace: string }>}
          initialLabels={initialLabels}
          initialAnnotations={initialAnnotations}
          registerLabels={registerLabels}
          registerAnnotations={registerAnnotations}
          labelError={pairErrors.labels}
          annotationError={pairErrors.annotations}
          namePlaceholder="my-deployment"
        />

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Container</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Image"
                placeholder="nginx:latest"
                withAsterisk
                key={form.key("image")}
                {...form.getInputProps("image")}
              />
              <Select
                label="Image Pull Policy"
                data={PULL_POLICY_OPTIONS}
                clearable
                placeholder="IfNotPresent"
                key={form.key("imagePullPolicy")}
                {...form.getInputProps("imagePullPolicy")}
              />
            </SimpleGrid>
            <TextInput
              label="Working Directory"
              placeholder="/app"
              key={form.key("workingDir")}
              {...form.getInputProps("workingDir")}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Tooltip
                label="Overrides the container ENTRYPOINT. Each token is a separate element."
                withArrow
                position="top-start"
              >
                <TagsInput
                  label={
                    <>
                      Command{" "}
                      <IconInfoCircle size={13} style={{ verticalAlign: "middle", opacity: 0.6 }} />
                    </>
                  }
                  placeholder="Add token, press Enter"
                  splitChars={[" "]}
                  key={form.key("command")}
                  {...form.getInputProps("command")}
                />
              </Tooltip>
              <Tooltip
                label="Overrides the container CMD. Each token is a separate element."
                withArrow
                position="top-start"
              >
                <TagsInput
                  label={
                    <>
                      Args{" "}
                      <IconInfoCircle size={13} style={{ verticalAlign: "middle", opacity: 0.6 }} />
                    </>
                  }
                  placeholder="Add token, press Enter"
                  splitChars={[" "]}
                  key={form.key("args")}
                  {...form.getInputProps("args")}
                />
              </Tooltip>
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>Ports</Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                type="button"
                onClick={() =>
                  setPorts((prev) => [...prev, { containerPort: 80, protocol: "TCP" }])
                }
              >
                Add Port
              </Button>
            </Group>
            {ports.map((port, i) => (
              <Group key={i} gap="xs" wrap="nowrap" align="flex-end">
                <NumberInput
                  label={i === 0 ? "Container Port" : undefined}
                  min={1}
                  max={65535}
                  style={{ flex: 2 }}
                  value={port.containerPort}
                  onChange={(v) =>
                    setPorts((prev) =>
                      prev.map((p, idx) =>
                        idx === i ? { ...p, containerPort: Number(v) || 80 } : p
                      )
                    )
                  }
                />
                <Select
                  label={i === 0 ? "Protocol" : undefined}
                  data={PROTOCOL_OPTIONS}
                  style={{ flex: 1 }}
                  value={port.protocol ?? "TCP"}
                  onChange={(v) =>
                    setPorts((prev) =>
                      prev.map((p, idx) =>
                        idx === i
                          ? {
                              ...p,
                              protocol: (v ?? "TCP") as ContainerPort["protocol"]
                            }
                          : p
                      )
                    )
                  }
                />
                <TextInput
                  label={i === 0 ? "Name" : undefined}
                  placeholder="http"
                  style={{ flex: 2 }}
                  value={port.name ?? ""}
                  onChange={(e) =>
                    setPorts((prev) =>
                      prev.map((p, idx) =>
                        idx === i ? { ...p, name: e.currentTarget.value || undefined } : p
                      )
                    )
                  }
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  type="button"
                  mb={i === 0 ? 2 : 0}
                  onClick={() => setPorts((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            {ports.length === 0 && (
              <Text size="sm" c="dimmed">
                None
              </Text>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Environment</Text>
            <UncontrolledKeyValuePairs
              label="Environment Variables"
              description="Plain key/value pairs set directly on the container"
              initial={initialEnvVars}
              register={registerEnvVars}
              keyPlaceholder="MY_VAR"
              valuePlaceholder="value"
            />
            <Divider />
            <Group justify="space-between">
              <Stack gap={0}>
                <Text fw={500} size="sm">
                  Env From
                </Text>
                <Text size="xs" c="dimmed">
                  Inject all keys from a ConfigMap or Secret
                </Text>
              </Stack>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                type="button"
                onClick={() =>
                  setEnvFromEntries((prev) => [
                    ...prev,
                    { refType: "configMap", name: "", prefix: "" }
                  ])
                }
              >
                Add Ref
              </Button>
            </Group>
            {envFromEntries.map((entry, i) => (
              <Group key={i} gap="xs" wrap="nowrap" align="flex-end">
                <Select
                  label={i === 0 ? "Type" : undefined}
                  data={[
                    { label: "ConfigMap", value: "configMap" },
                    { label: "Secret", value: "secret" }
                  ]}
                  style={{ flex: 1 }}
                  value={entry.refType}
                  onChange={(v) =>
                    setEnvFromEntries((prev) =>
                      prev.map((e, idx) =>
                        idx === i
                          ? {
                              ...e,
                              refType: (v ?? "configMap") as EnvFromEntry["refType"]
                            }
                          : e
                      )
                    )
                  }
                />
                <TextInput
                  label={i === 0 ? "Name" : undefined}
                  placeholder="my-config"
                  style={{ flex: 2 }}
                  value={entry.name}
                  onChange={(e) =>
                    setEnvFromEntries((prev) =>
                      prev.map((en, idx) =>
                        idx === i ? { ...en, name: e.currentTarget.value } : en
                      )
                    )
                  }
                />
                <TextInput
                  label={i === 0 ? "Prefix" : undefined}
                  placeholder="APP_"
                  style={{ flex: 1 }}
                  value={entry.prefix}
                  onChange={(e) =>
                    setEnvFromEntries((prev) =>
                      prev.map((en, idx) =>
                        idx === i ? { ...en, prefix: e.currentTarget.value } : en
                      )
                    )
                  }
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  type="button"
                  mb={i === 0 ? 2 : 0}
                  onClick={() => setEnvFromEntries((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            {envFromEntries.length === 0 && (
              <Text size="sm" c="dimmed">
                None
              </Text>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Resources</Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <TextInput
                label="CPU Request"
                placeholder="100m"
                key={form.key("requestsCpu")}
                {...form.getInputProps("requestsCpu")}
              />
              <TextInput
                label="Memory Request"
                placeholder="128Mi"
                key={form.key("requestsMemory")}
                {...form.getInputProps("requestsMemory")}
              />
              <TextInput
                label="CPU Limit"
                placeholder="500m"
                key={form.key("limitsCpu")}
                {...form.getInputProps("limitsCpu")}
              />
              <TextInput
                label="Memory Limit"
                placeholder="512Mi"
                key={form.key("limitsMemory")}
                {...form.getInputProps("limitsMemory")}
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Text fw={600}>Probes</Text>
            <SimpleGrid cols={{ base: 3, sm: 3 }}>
              <ProbeSection label="Liveness" state={livenessState} onChange={setLivenessState} />
              <ProbeSection label="Readiness" state={readinessState} onChange={setReadinessState} />
              <ProbeSection label="Startup" state={startupState} onChange={setStartupState} />
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Rollout</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <NumberInput
                label="Replicas"
                min={0}
                clampBehavior="strict"
                key={form.key("replicas")}
                {...form.getInputProps("replicas")}
              />
              <Select
                label="Strategy"
                data={[
                  { label: "RollingUpdate", value: "RollingUpdate" },
                  { label: "Recreate", value: "Recreate" }
                ]}
                value={strategyType}
                onChange={(v) =>
                  setStrategyType((v ?? "RollingUpdate") as "RollingUpdate" | "Recreate")
                }
              />
            </SimpleGrid>
            {strategyType === "RollingUpdate" && (
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Max Surge"
                  placeholder="25%"
                  key={form.key("maxSurge")}
                  {...form.getInputProps("maxSurge")}
                />
                <TextInput
                  label="Max Unavailable"
                  placeholder="25%"
                  key={form.key("maxUnavailable")}
                  {...form.getInputProps("maxUnavailable")}
                />
              </SimpleGrid>
            )}
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <NumberInput
                label="Min Ready (s)"
                min={0}
                key={form.key("minReadySeconds")}
                {...form.getInputProps("minReadySeconds")}
              />
              <NumberInput
                label="Revision History Limit"
                min={0}
                key={form.key("revisionHistoryLimit")}
                {...form.getInputProps("revisionHistoryLimit")}
              />
              <NumberInput
                label="Progress Deadline (s)"
                min={1}
                key={form.key("progressDeadlineSeconds")}
                {...form.getInputProps("progressDeadlineSeconds")}
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Pod Settings</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Service Account"
                placeholder="default"
                key={form.key("serviceAccount")}
                {...form.getInputProps("serviceAccount")}
              />
              <Select
                label="DNS Policy"
                data={DNS_POLICY_OPTIONS}
                clearable
                placeholder="ClusterFirst"
                key={form.key("dnsPolicy")}
                {...form.getInputProps("dnsPolicy")}
              />
            </SimpleGrid>
            <TextInput
              label="Node Name"
              placeholder="node-1"
              key={form.key("nodeName")}
              {...form.getInputProps("nodeName")}
            />
            <UncontrolledKeyValuePairs
              label="Node Selector"
              initial={initialNodeSelector}
              register={registerNodeSelect}
              keyPlaceholder="kubernetes.io/arch"
              valuePlaceholder="amd64"
            />
            <TagsInput
              label="Image Pull Secrets"
              placeholder="Add secret name, press Enter"
              key={form.key("imagePullSecrets")}
              {...form.getInputProps("imagePullSecrets")}
            />
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <NumberInput
                label="Termination Grace Period (s)"
                min={0}
                key={form.key("terminationGracePeriodSeconds")}
                {...form.getInputProps("terminationGracePeriodSeconds")}
              />
              <TextInput
                label="Priority Class"
                placeholder="high-priority"
                key={form.key("priorityClassName")}
                {...form.getInputProps("priorityClassName")}
              />
              <TextInput
                label="Runtime Class"
                placeholder="gvisor"
                key={form.key("runtimeClassName")}
                {...form.getInputProps("runtimeClassName")}
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Security</Text>
            <Text fw={500} size="sm" c="dimmed">
              Container
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <NumberInput
                label="Run As User"
                min={0}
                key={form.key("cscRunAsUser")}
                {...form.getInputProps("cscRunAsUser")}
              />
              <NumberInput
                label="Run As Group"
                min={0}
                key={form.key("cscRunAsGroup")}
                {...form.getInputProps("cscRunAsGroup")}
              />
            </SimpleGrid>
            <Group gap="lg">
              <Checkbox
                label="Run As Non-Root"
                key={form.key("cscRunAsNonRoot")}
                {...form.getInputProps("cscRunAsNonRoot", { type: "checkbox" })}
              />
              <Checkbox
                label="Read-Only Root Filesystem"
                key={form.key("cscReadOnly")}
                {...form.getInputProps("cscReadOnly", { type: "checkbox" })}
              />
              <Checkbox
                label="Disallow Privilege Escalation"
                key={form.key("cscNoPrivEsc")}
                {...form.getInputProps("cscNoPrivEsc", { type: "checkbox" })}
              />
              <Checkbox
                label="Privileged"
                key={form.key("cscPrivileged")}
                {...form.getInputProps("cscPrivileged", { type: "checkbox" })}
              />
            </Group>

            <Divider />

            <Text fw={500} size="sm" c="dimmed">
              Pod
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <NumberInput
                label="Run As User"
                min={0}
                key={form.key("pscRunAsUser")}
                {...form.getInputProps("pscRunAsUser")}
              />
              <NumberInput
                label="Run As Group"
                min={0}
                key={form.key("pscRunAsGroup")}
                {...form.getInputProps("pscRunAsGroup")}
              />
              <NumberInput
                label="FS Group"
                min={0}
                key={form.key("pscFsGroup")}
                {...form.getInputProps("pscFsGroup")}
              />
            </SimpleGrid>
            <Checkbox
              label="Run As Non-Root"
              key={form.key("pscRunAsNonRoot")}
              {...form.getInputProps("pscRunAsNonRoot", { type: "checkbox" })}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>Tolerations</Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                type="button"
                onClick={() => setTolerations((prev) => [...prev, { operator: "Equal" }])}
              >
                Add Toleration
              </Button>
            </Group>
            {tolerations.map((tol, i) => (
              <Group key={i} gap="xs" wrap="nowrap" align="flex-end">
                <TextInput
                  label={i === 0 ? "Key" : undefined}
                  placeholder="dedicated"
                  style={{ flex: 2 }}
                  value={tol.key ?? ""}
                  onChange={(e) =>
                    setTolerations((prev) =>
                      prev.map((t, idx) =>
                        idx === i ? { ...t, key: e.currentTarget.value || undefined } : t
                      )
                    )
                  }
                />
                <Select
                  label={i === 0 ? "Operator" : undefined}
                  data={TOLERATION_OPERATOR_OPTIONS}
                  style={{ flex: 1 }}
                  value={tol.operator ?? "Equal"}
                  onChange={(v) =>
                    setTolerations((prev) =>
                      prev.map((t, idx) =>
                        idx === i
                          ? {
                              ...t,
                              operator: (v ?? "Equal") as Toleration["operator"]
                            }
                          : t
                      )
                    )
                  }
                />
                <TextInput
                  label={i === 0 ? "Value" : undefined}
                  placeholder="gpu"
                  style={{ flex: 2 }}
                  disabled={tol.operator === "Exists"}
                  value={tol.value ?? ""}
                  onChange={(e) =>
                    setTolerations((prev) =>
                      prev.map((t, idx) =>
                        idx === i ? { ...t, value: e.currentTarget.value || undefined } : t
                      )
                    )
                  }
                />
                <Select
                  label={i === 0 ? "Effect" : undefined}
                  data={TOLERATION_EFFECT_OPTIONS}
                  clearable
                  placeholder="Any"
                  style={{ flex: 2 }}
                  value={tol.effect ?? null}
                  onChange={(v) =>
                    setTolerations((prev) =>
                      prev.map((t, idx) =>
                        idx === i
                          ? {
                              ...t,
                              effect: (v ?? undefined) as Toleration["effect"]
                            }
                          : t
                      )
                    )
                  }
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  type="button"
                  mb={i === 0 ? 2 : 0}
                  onClick={() => setTolerations((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            {tolerations.length === 0 && (
              <Text size="sm" c="dimmed">
                None
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
