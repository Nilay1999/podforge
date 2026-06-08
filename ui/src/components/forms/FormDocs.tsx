import { Accordion, Badge, Code, Group, ScrollArea, Stack, Table, Text } from "@mantine/core";
import type { ResourceKind } from "@src/types";

interface FieldDoc {
  field: string;
  required?: boolean;
  type: string;
  description: string;
  example?: string;
}

interface SectionDoc {
  title: string;
  description?: string;
  fields: FieldDoc[];
}

function FieldTable({ fields }: { fields: FieldDoc[] }) {
  return (
    <Table fz="sm" verticalSpacing="xs" withRowBorders={false}>
      <Table.Tbody>
        {fields.map((f) => (
          <Table.Tr key={f.field}>
            <Table.Td style={{ width: 160, verticalAlign: "top" }}>
              <Group gap={4} wrap="nowrap">
                <Code fz="xs" style={{ whiteSpace: "nowrap" }}>
                  {f.field}
                </Code>
                {f.required && (
                  <Badge size="xs" color="red" variant="light">
                    required
                  </Badge>
                )}
              </Group>
            </Table.Td>
            <Table.Td style={{ width: 90, verticalAlign: "top" }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                {f.type}
              </Text>
            </Table.Td>
            <Table.Td style={{ verticalAlign: "top" }}>
              <Text size="xs">{f.description}</Text>
              {f.example && (
                <Text size="xs" c="dimmed" mt={2}>
                  e.g. <Code fz="xs">{f.example}</Code>
                </Text>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function DocSections({ sections }: { sections: SectionDoc[] }) {
  return (
    <Accordion variant="separated" radius="md" defaultValue={sections[0]?.title}>
      {sections.map((section) => (
        <Accordion.Item key={section.title} value={section.title}>
          <Accordion.Control>
            <Text fw={600} size="sm">
              {section.title}
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              {section.description && (
                <Text size="xs" c="dimmed">
                  {section.description}
                </Text>
              )}
              <FieldTable fields={section.fields} />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

const METADATA_FIELDS: FieldDoc[] = [
  {
    field: "name",
    required: true,
    type: "string",
    description: "DNS-label name unique within the namespace. Must match [a-z0-9-] and start/end with alphanumeric.",
    example: "my-app"
  },
  {
    field: "namespace",
    type: "string",
    description: "Kubernetes namespace to deploy into. Defaults to 'default'. Must already exist in the cluster.",
    example: "production"
  },
  {
    field: "labels",
    type: "map[string]string",
    description: "Key/value pairs attached to the object for selection and grouping. Used by Services, selectors, and kubectl queries.",
    example: "app=my-app, env=prod"
  },
  {
    field: "annotations",
    type: "map[string]string",
    description: "Arbitrary non-identifying metadata. Tools and controllers read these but they are not used for selection.",
    example: "prometheus.io/scrape=true"
  }
];

const POD_DOCS: SectionDoc[] = [
  {
    title: "Metadata",
    fields: METADATA_FIELDS
  },
  {
    title: "Container",
    description: "Podforge currently supports a single container per Pod. Use Deployment for multi-replica workloads.",
    fields: [
      {
        field: "image",
        required: true,
        type: "string",
        description: "Container image to run. Include a tag to pin the version; omitting the tag defaults to 'latest'.",
        example: "nginx:1.25"
      },
      {
        field: "containerPort",
        type: "integer",
        description: "Port the container listens on inside the Pod. This is informational; it does not affect networking unless a Service selects this Pod.",
        example: "8080"
      }
    ]
  }
];

const DEPLOYMENT_DOCS: SectionDoc[] = [
  {
    title: "Metadata",
    fields: METADATA_FIELDS
  },
  {
    title: "Container",
    description: "Settings for the single container template inside every replica Pod.",
    fields: [
      {
        field: "image",
        required: true,
        type: "string",
        description: "Container image. Always pin to a specific tag in production to ensure reproducible rollouts.",
        example: "my-app:v1.2.3"
      },
      {
        field: "imagePullPolicy",
        type: "enum",
        description: "When to pull the image. IfNotPresent skips the pull if the image is already on the node. Always re-pulls on every Pod start. Never uses only locally cached images.",
        example: "IfNotPresent"
      },
      {
        field: "workingDir",
        type: "string",
        description: "Working directory inside the container for command execution. Overrides the image's WORKDIR.",
        example: "/app"
      },
      {
        field: "command",
        type: "[]string",
        description: "Overrides the container's ENTRYPOINT. Enter each token separately. Leave empty to use the image's default ENTRYPOINT.",
        example: "[\"/bin/sh\", \"-c\"]"
      },
      {
        field: "args",
        type: "[]string",
        description: "Overrides the container's CMD. Passed as arguments to the command (or to the ENTRYPOINT if command is not set).",
        example: "[\"--config=/etc/app.yaml\"]"
      }
    ]
  },
  {
    title: "Ports",
    description: "Declares which ports the container exposes. Informational metadata — does not open firewall rules.",
    fields: [
      {
        field: "containerPort",
        type: "integer (1–65535)",
        description: "Port number the container process listens on.",
        example: "8080"
      },
      {
        field: "protocol",
        type: "TCP | UDP | SCTP",
        description: "Transport protocol for this port. Defaults to TCP.",
        example: "TCP"
      },
      {
        field: "name",
        type: "string",
        description: "Optional name for this port. Services can reference ports by name instead of number, which is more resilient to port changes.",
        example: "http"
      }
    ]
  },
  {
    title: "Environment",
    description: "Inject configuration into the container at runtime without rebuilding the image.",
    fields: [
      {
        field: "envVars",
        type: "map[string]string",
        description: "Plain key/value environment variables set directly on the container.",
        example: "LOG_LEVEL=debug"
      },
      {
        field: "envFrom.type",
        type: "ConfigMap | Secret",
        description: "Source resource type to inject all keys from as environment variables."
      },
      {
        field: "envFrom.name",
        type: "string",
        description: "Name of the ConfigMap or Secret to load all keys from. The resource must exist in the same namespace.",
        example: "app-config"
      },
      {
        field: "envFrom.prefix",
        type: "string",
        description: "Optional prefix prepended to every injected key. Useful to namespace variables from different sources.",
        example: "APP_"
      }
    ]
  },
  {
    title: "Resources",
    description: "CPU and memory requests/limits follow the Kubernetes resource model. Requests affect scheduling; limits enforce runtime caps.",
    fields: [
      {
        field: "requestsCpu",
        type: "string",
        description: "Minimum CPU the scheduler guarantees the container. Uses millicores (m) or whole cores.",
        example: "100m"
      },
      {
        field: "requestsMemory",
        type: "string",
        description: "Minimum memory the scheduler guarantees. Uses Mi/Gi suffixes.",
        example: "128Mi"
      },
      {
        field: "limitsCpu",
        type: "string",
        description: "Hard CPU cap. The container is throttled if it exceeds this. Setting equal to the request removes burstability.",
        example: "500m"
      },
      {
        field: "limitsMemory",
        type: "string",
        description: "Hard memory cap. The container is OOM-killed if it exceeds this. Always set a memory limit in production.",
        example: "512Mi"
      }
    ]
  },
  {
    title: "Probes",
    description: "Health checks Kubernetes uses to manage Pod lifecycle. All three types share the same timing parameters.",
    fields: [
      {
        field: "livenessProbe",
        type: "Probe",
        description: "Checks if the container is alive. A failed liveness probe triggers a container restart according to the restartPolicy."
      },
      {
        field: "readinessProbe",
        type: "Probe",
        description: "Checks if the container is ready to serve traffic. A failing readiness probe removes the Pod from Service endpoints without restarting it."
      },
      {
        field: "startupProbe",
        type: "Probe",
        description: "Used for slow-starting containers. Liveness and readiness probes are disabled until the startup probe succeeds."
      },
      {
        field: "httpGet.path",
        type: "string",
        description: "HTTP path to probe. The container must return 2xx–3xx for the probe to succeed.",
        example: "/healthz"
      },
      {
        field: "exec.command",
        type: "[]string",
        description: "Command to execute inside the container. Exit code 0 is success.",
        example: "[\"pg_isready\", \"-U\", \"postgres\"]"
      },
      {
        field: "tcpSocket.port",
        type: "integer",
        description: "TCP port to connect to. Success if the connection is established."
      },
      {
        field: "initialDelaySeconds",
        type: "integer",
        description: "Seconds after container start before the first probe fires. Set this longer than your app's boot time.",
        example: "15"
      },
      {
        field: "periodSeconds",
        type: "integer",
        description: "How often (in seconds) to perform the probe. Default: 10.",
        example: "10"
      },
      {
        field: "failureThreshold",
        type: "integer",
        description: "Consecutive failures before the probe is considered failed. Default: 3.",
        example: "3"
      }
    ]
  },
  {
    title: "Rollout",
    description: "Controls replica count and how updates are rolled out.",
    fields: [
      {
        field: "replicas",
        type: "integer",
        description: "Desired number of identical Pod replicas. Set to 0 to scale down without deleting the Deployment.",
        example: "3"
      },
      {
        field: "strategy",
        type: "RollingUpdate | Recreate",
        description: "RollingUpdate gradually replaces Pods with zero downtime. Recreate kills all existing Pods before creating new ones — causes downtime but avoids running two versions simultaneously."
      },
      {
        field: "maxSurge",
        type: "integer or %",
        description: "RollingUpdate only. Maximum number of Pods that can be created above the desired count during an update.",
        example: "25%"
      },
      {
        field: "maxUnavailable",
        type: "integer or %",
        description: "RollingUpdate only. Maximum number of Pods that can be unavailable during an update.",
        example: "25%"
      },
      {
        field: "minReadySeconds",
        type: "integer",
        description: "Seconds a new Pod must be ready (no container crashing) before it is considered available. Slows rollouts but increases safety.",
        example: "30"
      },
      {
        field: "revisionHistoryLimit",
        type: "integer",
        description: "Number of old ReplicaSets to retain for rollback. Default is 10.",
        example: "5"
      },
      {
        field: "progressDeadlineSeconds",
        type: "integer",
        description: "Seconds before a stalled rollout is marked as failed. Default is 600.",
        example: "600"
      }
    ]
  },
  {
    title: "Pod Settings",
    description: "Pod-level scheduling and identity configuration.",
    fields: [
      {
        field: "serviceAccount",
        type: "string",
        description: "Name of the ServiceAccount the Pod runs as. Determines API access permissions via RBAC. Defaults to 'default'.",
        example: "my-app-sa"
      },
      {
        field: "dnsPolicy",
        type: "enum",
        description: "ClusterFirst (default) uses cluster DNS. Default uses the node's DNS. None disables cluster DNS — use dnsConfig to set custom nameservers.",
        example: "ClusterFirst"
      },
      {
        field: "nodeName",
        type: "string",
        description: "Schedule the Pod on this specific node, bypassing the scheduler. Rarely needed — prefer nodeSelector or affinity.",
        example: "worker-1"
      },
      {
        field: "nodeSelector",
        type: "map[string]string",
        description: "Schedule the Pod only on nodes matching all these labels.",
        example: "kubernetes.io/arch=amd64"
      },
      {
        field: "imagePullSecrets",
        type: "[]string",
        description: "Names of Secrets holding credentials for private container registries. The Secrets must be of type kubernetes.io/dockerconfigjson.",
        example: "my-registry-secret"
      },
      {
        field: "terminationGracePeriodSeconds",
        type: "integer",
        description: "Time given to the container to shut down gracefully after receiving SIGTERM before SIGKILL is sent. Default: 30.",
        example: "30"
      },
      {
        field: "priorityClassName",
        type: "string",
        description: "References a PriorityClass object that controls scheduling priority and preemption.",
        example: "high-priority"
      },
      {
        field: "runtimeClassName",
        type: "string",
        description: "Selects a container runtime (e.g. gvisor, kata-containers) registered as a RuntimeClass.",
        example: "gvisor"
      }
    ]
  },
  {
    title: "Security",
    description: "Container and Pod security contexts restrict what processes can do inside the container/Pod.",
    fields: [
      {
        field: "container.runAsUser",
        type: "integer",
        description: "UID to run the container process as. Overrides the image's USER instruction.",
        example: "1000"
      },
      {
        field: "container.runAsGroup",
        type: "integer",
        description: "GID for the container process.",
        example: "1000"
      },
      {
        field: "container.runAsNonRoot",
        type: "boolean",
        description: "Prevent the container from running as UID 0 (root). Kubernetes validates this at admission."
      },
      {
        field: "container.readOnlyRootFilesystem",
        type: "boolean",
        description: "Mount the container's root filesystem as read-only. Any writes must go to mounted volumes."
      },
      {
        field: "container.allowPrivilegeEscalation",
        type: "boolean",
        description: "When disabled (recommended), prevents processes from gaining more privileges than their parent (no setuid binaries)."
      },
      {
        field: "container.privileged",
        type: "boolean",
        description: "Grants the container all Linux capabilities and host device access. Equivalent to running as root on the node. Avoid unless absolutely necessary."
      },
      {
        field: "pod.fsGroup",
        type: "integer",
        description: "GID applied to mounted volumes and files created in them. Useful for shared volume access between containers.",
        example: "2000"
      }
    ]
  },
  {
    title: "Tolerations",
    description: "Allow Pods to be scheduled onto nodes with matching taints. A toleration must match the taint's key, value, and effect.",
    fields: [
      {
        field: "key",
        type: "string",
        description: "The taint key to tolerate. Leave empty with operator Exists to tolerate all taints.",
        example: "dedicated"
      },
      {
        field: "operator",
        type: "Equal | Exists",
        description: "Equal requires the value to match. Exists tolerates any taint with the matching key (value is ignored)."
      },
      {
        field: "value",
        type: "string",
        description: "Required when operator is Equal. Must exactly match the taint's value.",
        example: "gpu"
      },
      {
        field: "effect",
        type: "NoSchedule | PreferNoSchedule | NoExecute",
        description: "Which taint effect to tolerate. Empty means tolerate all effects. NoExecute also controls eviction of already-running Pods."
      }
    ]
  }
];

const CONFIGMAP_DOCS: SectionDoc[] = [
  {
    title: "Metadata",
    fields: METADATA_FIELDS
  },
  {
    title: "Data",
    description: "Plain text key/value pairs stored in etcd and mounted into Pods as environment variables or files.",
    fields: [
      {
        field: "key",
        type: "string",
        description: "Valid identifier for the config entry. When mounted as a file, this becomes the filename.",
        example: "database_url"
      },
      {
        field: "value",
        type: "string",
        description: "Plain text value. No encoding required. May contain multi-line content (e.g. config files).",
        example: "postgres://db:5432/mydb"
      }
    ]
  },
  {
    title: "Binary Data",
    description: "For non-UTF-8 data (certificates, binary blobs). Values must be base64-encoded before entry.",
    fields: [
      {
        field: "key",
        type: "string",
        description: "Identifier for the binary entry. When mounted as a file, this becomes the filename.",
        example: "tls.crt"
      },
      {
        field: "value",
        type: "base64 string",
        description: "Base64-encoded representation of the binary content.",
        example: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t..."
      }
    ]
  },
  {
    title: "Configuration",
    fields: [
      {
        field: "immutable",
        type: "boolean",
        description: "When enabled, the ConfigMap's data and binaryData cannot be updated. The only way to change it is to delete and recreate. Kubernetes stops watching immutable ConfigMaps from the API server, which reduces load at scale."
      }
    ]
  }
];

const SERVICE_DOCS: SectionDoc[] = [
  {
    title: "Metadata",
    fields: METADATA_FIELDS
  },
  {
    title: "Service Type",
    description: "Determines how the Service is exposed.",
    fields: [
      {
        field: "ClusterIP",
        type: "type",
        description: "Default. Exposes the Service on a cluster-internal IP only. Reachable from within the cluster."
      },
      {
        field: "NodePort",
        type: "type",
        description: "Exposes the Service on each Node's IP at a static port (30000–32767). Accessible from outside the cluster at NodeIP:NodePort."
      },
      {
        field: "LoadBalancer",
        type: "type",
        description: "Creates an external load balancer via the cloud provider. Includes a NodePort and ClusterIP automatically."
      },
      {
        field: "ExternalName",
        type: "type",
        description: "Maps the Service to a DNS name (no proxying or load balancing). Returns a CNAME record pointing to the external name."
      },
      {
        field: "externalName",
        type: "string",
        description: "Required for ExternalName type. The external DNS name to resolve to.",
        example: "my.database.example.com"
      }
    ]
  },
  {
    title: "Selector",
    description: "Identifies which Pods receive traffic from this Service. The Service continuously syncs its endpoints to match Pods with these labels.",
    fields: [
      {
        field: "selector",
        type: "map[string]string",
        description: "Label key/value pairs. Pods with all these labels will be included in the Service's Endpoints. Leave empty for headless or external services.",
        example: "app=my-app"
      }
    ]
  },
  {
    title: "Ports",
    description: "Defines how traffic is routed from the Service to the backing Pods.",
    fields: [
      {
        field: "name",
        type: "string",
        description: "Optional port name. Required when multiple ports are defined. Services can reference container ports by name.",
        example: "http"
      },
      {
        field: "protocol",
        type: "TCP | UDP | SCTP",
        description: "Transport protocol. Must match the container's protocol for the port.",
        example: "TCP"
      },
      {
        field: "port",
        type: "integer",
        description: "Port the Service listens on. Clients inside the cluster connect to this port.",
        example: "80"
      },
      {
        field: "targetPort",
        type: "integer or name",
        description: "Port on the backing Pods that receives the traffic. Can be a port number or a named containerPort.",
        example: "8080"
      },
      {
        field: "nodePort",
        type: "integer (30000–32767)",
        description: "NodePort/LoadBalancer only. The port opened on every cluster node. Omit to let Kubernetes allocate one automatically.",
        example: "30080"
      }
    ]
  }
];

const SECRET_DOCS: SectionDoc[] = [
  {
    title: "Metadata",
    fields: METADATA_FIELDS
  },
  {
    title: "Secret Type",
    description: "The type constrains which keys are expected and how the Secret is used by Kubernetes internals.",
    fields: [
      {
        field: "Opaque",
        type: "type",
        description: "Default. Arbitrary user-defined key/value data. Use for passwords, API keys, connection strings."
      },
      {
        field: "kubernetes.io/tls",
        type: "type",
        description: "TLS certificate and private key. Expects tls.crt and tls.key keys. Used by Ingress controllers."
      },
      {
        field: "kubernetes.io/dockerconfigjson",
        type: "type",
        description: "Docker registry credentials in JSON format. Referenced by imagePullSecrets on Pods."
      },
      {
        field: "kubernetes.io/basic-auth",
        type: "type",
        description: "Basic HTTP auth credentials. Expects username and password keys."
      },
      {
        field: "kubernetes.io/ssh-auth",
        type: "type",
        description: "SSH private key. Expects an ssh-privatekey key."
      },
      {
        field: "kubernetes.io/service-account-token",
        type: "type",
        description: "Automatically created by Kubernetes to hold ServiceAccount tokens. Rarely created manually."
      }
    ]
  },
  {
    title: "Data",
    description: "String data is stored base64-encoded in etcd but you provide plain text — Kubernetes handles the encoding.",
    fields: [
      {
        field: "key",
        type: "string",
        description: "Identifier for this secret entry. When mounted as a file, this becomes the filename.",
        example: "DB_PASSWORD"
      },
      {
        field: "value",
        type: "string (plain text)",
        description: "Plain text secret value. Kubernetes encodes it to base64 before storing. It is NOT encrypted at rest by default — use envelope encryption or a secrets manager for sensitive workloads.",
        example: "s3cr3t!"
      }
    ]
  },
  {
    title: "Configuration",
    fields: [
      {
        field: "immutable",
        type: "boolean",
        description: "When enabled, the Secret's data cannot be updated. Kubernetes stops watching the Secret from API server — reduces load at scale and prevents accidental changes to critical credentials."
      }
    ]
  }
];

const DOCS_BY_KIND: Record<ResourceKind, SectionDoc[]> = {
  Pod: POD_DOCS,
  Deployment: DEPLOYMENT_DOCS,
  ConfigMap: CONFIGMAP_DOCS,
  Service: SERVICE_DOCS,
  Secret: SECRET_DOCS
};

export function FormDocs({ kind }: { kind: ResourceKind }) {
  const sections = DOCS_BY_KIND[kind];

  return (
    <ScrollArea h="100%" px="lg" py="md">
      <Stack gap="xs" pb="xl">
        <Text size="xs" c="dimmed">
          Field reference for the {kind} form. Fields marked{" "}
          <Badge size="xs" color="red" variant="light">
            required
          </Badge>{" "}
          must be filled before applying.
        </Text>
        <DocSections sections={sections} />
      </Stack>
    </ScrollArea>
  );
}
