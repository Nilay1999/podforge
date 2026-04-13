# Kubernetes Core Kinds — Full YAML Reference

Use this as a reference to build Go request types for the k8s-orchestrator API.

---

## 1. Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: string                        # required
  namespace: string                   # required
  labels:                             # map[string]string
    key: value
  annotations:                        # map[string]string
    key: value
spec:
  # ── Containers (required, at least one) ──────────────────────────────────
  containers:                         # []Container, required
    - name: string                    # required
      image: string                   # required
      imagePullPolicy: string         # Always | IfNotPresent | Never

      command:                        # []string — entrypoint override
        - string
      args:                           # []string — arguments to entrypoint
        - string
      workingDir: string              # working directory inside container

      # Ports
      ports:                          # []ContainerPort
        - name: string                # optional, must be unique within pod
          containerPort: int32        # required, 1-65535
          protocol: string            # TCP (default) | UDP | SCTP
          hostPort: int32             # optional, maps to host

      # Environment
      env:                            # []EnvVar
        - name: string                # required
          value: string               # plain value
          valueFrom:                  # or reference a source (mutually exclusive with value)
            configMapKeyRef:
              name: string            # ConfigMap name
              key: string             # key inside ConfigMap
              optional: bool
            secretKeyRef:
              name: string            # Secret name
              key: string             # key inside Secret
              optional: bool
            fieldRef:
              fieldPath: string       # e.g. metadata.name, status.podIP
            resourceFieldRef:
              containerName: string
              resource: string        # e.g. limits.cpu, requests.memory
              divisor: string         # resource quantity

      envFrom:                        # []EnvFromSource — bulk import env
        - configMapRef:
            name: string
            optional: bool
          secretRef:
            name: string
            optional: bool
          prefix: string              # prefix added to each key

      # Resources
      resources:
        requests:
          cpu: string                 # e.g. "100m", "0.5"
          memory: string              # e.g. "128Mi", "1Gi"
          ephemeral-storage: string   # e.g. "1Gi"
        limits:
          cpu: string
          memory: string
          ephemeral-storage: string

      # Volume Mounts
      volumeMounts:                   # []VolumeMount
        - name: string                # must match a volume name
          mountPath: string           # path inside container
          subPath: string             # mount a sub-path of the volume
          subPathExpr: string         # sub-path with env var expansion
          readOnly: bool              # default false

      # Probes
      livenessProbe: &probe
        httpGet:                      # one of httpGet, exec, tcpSocket, grpc
          path: string
          port: int32 | string        # port number or port name
          scheme: string              # HTTP (default) | HTTPS
          httpHeaders:
            - name: string
              value: string
        exec:
          command:                     # []string
            - string
        tcpSocket:
          port: int32 | string
        grpc:
          port: int32                 # required
          service: string             # optional
        initialDelaySeconds: int32    # default 0
        periodSeconds: int32          # default 10
        timeoutSeconds: int32         # default 1
        successThreshold: int32       # default 1
        failureThreshold: int32       # default 3
        terminationGracePeriodSeconds: int64

      readinessProbe: *probe          # same structure as livenessProbe
      startupProbe: *probe            # same structure as livenessProbe

      # Lifecycle Hooks
      lifecycle:
        postStart:                    # one of exec, httpGet
          exec:
            command:
              - string
          httpGet:
            path: string
            port: int32 | string
            scheme: string
            httpHeaders:
              - name: string
                value: string
        preStop:                      # same structure as postStart
          exec:
            command:
              - string
          httpGet:
            path: string
            port: int32 | string
            scheme: string
            httpHeaders:
              - name: string
                value: string

      # Security Context (container-level)
      securityContext:
        runAsUser: int64
        runAsGroup: int64
        runAsNonRoot: bool
        readOnlyRootFilesystem: bool
        allowPrivilegeEscalation: bool
        privileged: bool
        capabilities:
          add:                        # []string — e.g. NET_ADMIN, SYS_TIME
            - string
          drop:
            - string
        seccompProfile:
          type: string                # RuntimeDefault | Unconfined | Localhost
          localhostProfile: string    # path when type=Localhost
        seLinuxOptions:
          user: string
          role: string
          type: string
          level: string

      # Misc
      stdin: bool
      stdinOnce: bool
      tty: bool
      terminationMessagePath: string     # default /dev/termination-log
      terminationMessagePolicy: string   # File (default) | FallbackToLogsOnError

  # ── Init Containers ──────────────────────────────────────────────────────
  initContainers:                     # []Container — same structure as containers
    - name: string
      image: string
      # ... all the same fields as containers above

  # ── Volumes ──────────────────────────────────────────────────────────────
  volumes:                            # []Volume
    - name: string                    # required, referenced by volumeMounts

      # Exactly one source per volume:

      emptyDir:
        medium: string                # "" (disk, default) | Memory | HugePages
        sizeLimit: string             # resource quantity e.g. "1Gi"

      hostPath:
        path: string                  # required, path on host
        type: string                  # "" | DirectoryOrCreate | Directory | FileOrCreate
                                      # | File | Socket | CharDevice | BlockDevice

      configMap:
        name: string                  # ConfigMap name
        defaultMode: int32            # file permission, default 0644
        optional: bool
        items:                        # []KeyToPath — select specific keys
          - key: string
            path: string              # relative path inside mount
            mode: int32               # per-file permission

      secret:
        secretName: string
        defaultMode: int32            # default 0644
        optional: bool
        items:
          - key: string
            path: string
            mode: int32

      persistentVolumeClaim:
        claimName: string             # PVC name
        readOnly: bool

      projected:                      # combine multiple sources into one mount
        defaultMode: int32
        sources:
          - configMap:
              name: string
              items:
                - key: string
                  path: string
                  mode: int32
              optional: bool
          - secret:
              name: string
              items:
                - key: string
                  path: string
                  mode: int32
              optional: bool
          - serviceAccountToken:
              audience: string
              expirationSeconds: int64
              path: string            # required
          - downwardAPI:
              items:
                - path: string
                  fieldRef:
                    fieldPath: string
                  resourceFieldRef:
                    containerName: string
                    resource: string

      downwardAPI:
        defaultMode: int32
        items:
          - path: string              # required
            fieldRef:
              fieldPath: string       # e.g. metadata.labels, metadata.annotations
            resourceFieldRef:
              containerName: string
              resource: string

      nfs:
        server: string                # NFS server address
        path: string                  # exported path
        readOnly: bool

      csi:
        driver: string                # required
        readOnly: bool
        fsType: string
        volumeAttributes:             # map[string]string
          key: value
        nodePublishSecretRef:
          name: string

  # ── Pod Scheduling ───────────────────────────────────────────────────────
  nodeName: string                    # schedule to a specific node
  nodeSelector:                       # map[string]string — simple label matching
    key: value

  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:            # []NodeSelectorTerm — OR'd together
          - matchExpressions:         # []NodeSelectorRequirement — AND'd together
              - key: string
                operator: string      # In | NotIn | Exists | DoesNotExist | Gt | Lt
                values:
                  - string
            matchFields:              # same structure, matches node fields
              - key: string
                operator: string
                values:
                  - string
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: int32               # 1-100
          preference:
            matchExpressions:
              - key: string
                operator: string
                values:
                  - string

    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - topologyKey: string         # required, e.g. kubernetes.io/hostname
          labelSelector:
            matchLabels:              # map[string]string
              key: value
            matchExpressions:
              - key: string
                operator: string      # In | NotIn | Exists | DoesNotExist
                values:
                  - string
          namespaces:                 # []string
            - string
          namespaceSelector:
            matchLabels:
              key: value
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: int32
          podAffinityTerm:
            topologyKey: string
            labelSelector:
              matchLabels:
                key: value
              matchExpressions:
                - key: string
                  operator: string
                  values:
                    - string

    podAntiAffinity:                  # same structure as podAffinity
      requiredDuringSchedulingIgnoredDuringExecution:
        - topologyKey: string
          labelSelector:
            matchLabels:
              key: value
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: int32
          podAffinityTerm:
            topologyKey: string
            labelSelector:
              matchLabels:
                key: value

  tolerations:                        # []Toleration
    - key: string
      operator: string                # Equal (default) | Exists
      value: string                   # required when operator=Equal
      effect: string                  # NoSchedule | PreferNoSchedule | NoExecute | "" (all)
      tolerationSeconds: int64        # only for NoExecute

  topologySpreadConstraints:          # []TopologySpreadConstraint
    - maxSkew: int32                  # required
      topologyKey: string             # required
      whenUnsatisfiable: string       # DoNotSchedule | ScheduleAnyway
      labelSelector:
        matchLabels:
          key: value
      minDomains: int32
      nodeAffinityPolicy: string      # Honor | Ignore
      nodeTaintsPolicy: string        # Honor | Ignore
      matchLabelKeys:
        - string

  # ── Pod Identity & Permissions ───────────────────────────────────────────
  serviceAccountName: string
  automountServiceAccountToken: bool  # default true
  imagePullSecrets:                   # []LocalObjectReference
    - name: string

  # ── Pod Security Context ─────────────────────────────────────────────────
  securityContext:
    runAsUser: int64
    runAsGroup: int64
    runAsNonRoot: bool
    fsGroup: int64
    fsGroupChangePolicy: string       # OnRootMismatch | Always
    supplementalGroups:               # []int64
      - int64
    seccompProfile:
      type: string                    # RuntimeDefault | Unconfined | Localhost
      localhostProfile: string
    seLinuxOptions:
      user: string
      role: string
      type: string
      level: string
    sysctls:
      - name: string
        value: string

  # ── DNS ──────────────────────────────────────────────────────────────────
  dnsPolicy: string                   # ClusterFirst (default) | ClusterFirstWithHostNet
                                      # | Default | None
  dnsConfig:
    nameservers:                      # []string
      - string
    searches:                         # []string
      - string
    options:
      - name: string
        value: string

  # ── Host Settings ────────────────────────────────────────────────────────
  hostNetwork: bool                   # use host network namespace
  hostPID: bool                       # use host PID namespace
  hostIPC: bool                       # use host IPC namespace
  hostname: string
  subdomain: string                   # if set, FQDN = <hostname>.<subdomain>.<namespace>.svc.<cluster-domain>
  hostAliases:
    - ip: string
      hostnames:
        - string

  # ── Lifecycle ────────────────────────────────────────────────────────────
  restartPolicy: string               # Always (default) | OnFailure | Never
  terminationGracePeriodSeconds: int64 # default 30
  activeDeadlineSeconds: int64        # max time pod can be active
  priorityClassName: string
  priority: int32
  preemptionPolicy: string            # PreemptLowerPriority (default) | Never
  runtimeClassName: string

  # ── Readiness Gates ──────────────────────────────────────────────────────
  readinessGates:
    - conditionType: string

  # ── Overhead & Resource Management ───────────────────────────────────────
  overhead:                           # map[string]string — set by RuntimeClass
    cpu: string
    memory: string
  enableServiceLinks: bool            # default true
```

---

## 2. Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: string                        # required
  namespace: string                   # required
  labels:
    key: value
  annotations:
    key: value
spec:
  # ── Type ─────────────────────────────────────────────────────────────────
  type: string                        # ClusterIP (default) | NodePort | LoadBalancer
                                      # | ExternalName

  # ── Selector ─────────────────────────────────────────────────────────────
  selector:                           # map[string]string — matches pod labels
    key: value                        # not used with ExternalName type

  # ── Ports ────────────────────────────────────────────────────────────────
  ports:                              # []ServicePort
    - name: string                    # required if multiple ports
      protocol: string                # TCP (default) | UDP | SCTP
      port: int32                     # required — service port (what clients connect to)
      targetPort: int32 | string      # container port or port name, default = port
      nodePort: int32                 # 30000-32767, only for NodePort/LoadBalancer
      appProtocol: string             # e.g. HTTP, HTTPS, grpc — hint for proxies

  # ── ClusterIP Settings ──────────────────────────────────────────────────
  clusterIP: string                   # "None" for headless, or specific IP, or "" for auto
  clusterIPs:                         # []string — dual-stack support
    - string

  # ── IP Families (dual-stack) ─────────────────────────────────────────────
  ipFamilies:                         # []string
    - string                          # IPv4 | IPv6
  ipFamilyPolicy: string              # SingleStack | PreferDualStack | RequireDualStack

  # ── External Access ─────────────────────────────────────────────────────
  externalIPs:                        # []string — IPs that route to this service
    - string
  externalName: string                # only for type=ExternalName (DNS CNAME)
  externalTrafficPolicy: string       # Cluster (default) | Local
  internalTrafficPolicy: string       # Cluster (default) | Local

  # ── LoadBalancer Settings ────────────────────────────────────────────────
  loadBalancerIP: string              # request specific LB IP (deprecated in some clouds)
  loadBalancerSourceRanges:           # []string — CIDR ranges allowed to access LB
    - string                          # e.g. "10.0.0.0/8"
  loadBalancerClass: string           # use a specific LB implementation
  allocateLoadBalancerNodePorts: bool  # default true, set false to skip node ports

  # ── Session Affinity ─────────────────────────────────────────────────────
  sessionAffinity: string             # None (default) | ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: int32           # default 10800 (3h), max 86400

  # ── Health Check ─────────────────────────────────────────────────────────
  healthCheckNodePort: int32          # for LoadBalancer + externalTrafficPolicy=Local
  publishNotReadyAddresses: bool      # include not-ready pods in DNS, default false
```

---

## 3. ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: string                        # required
  namespace: string                   # required
  labels:
    key: value
  annotations:
    key: value

# Key-value pairs (UTF-8 string data)
data:                                 # map[string]string
  key: value                          # e.g. config file content, env values
  application.properties: |
    key1=value1
    key2=value2
  config.json: |
    {"key": "value"}

# Binary data (base64-encoded)
binaryData:                           # map[string][]byte
  key: base64-encoded-string          # e.g. binary config files, certs

# Immutability
immutable: bool                       # if true, cannot be updated (only deleted+recreated)
                                      # improves performance for large ConfigMaps
```

---

## 4. Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: string                        # required
  namespace: string                   # required
  labels:
    key: value
  annotations:
    key: value

# ── Type ───────────────────────────────────────────────────────────────────
type: string                          # default: Opaque
  # Built-in types:
  # Opaque                            — arbitrary user-defined data
  # kubernetes.io/service-account-token — ServiceAccount token
  # kubernetes.io/dockercfg           — serialized ~/.dockercfg
  # kubernetes.io/dockerconfigjson    — serialized ~/.docker/config.json
  # kubernetes.io/basic-auth          — basic authentication (username, password)
  # kubernetes.io/ssh-auth            — SSH private key (ssh-privatekey)
  # kubernetes.io/tls                 — TLS cert+key (tls.crt, tls.key)
  # bootstrap.kubernetes.io/token     — bootstrap token data

# ── Data ───────────────────────────────────────────────────────────────────
# Values MUST be base64-encoded
data:                                 # map[string][]byte (base64-encoded)
  username: dXNlcm5hbWU=             # base64("username")
  password: cGFzc3dvcmQ=             # base64("password")
  tls.crt: base64-encoded-cert
  tls.key: base64-encoded-key

# Plain-text alternative (Kubernetes encodes for you)
stringData:                           # map[string]string — merged into data on create
  username: plaintext-username
  password: plaintext-password

# Immutability
immutable: bool                       # same as ConfigMap
```

---

## 5. Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: string                        # required, globally unique
  labels:
    key: value
    # well-known labels:
    # kubernetes.io/metadata.name: string  — auto-set to namespace name
  annotations:
    key: value
spec:
  finalizers:                         # []string — block deletion until cleared
    - kubernetes                      # default finalizer
```

---

## 6. PersistentVolumeClaim (PVC)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: string                        # required
  namespace: string                   # required
  labels:
    key: value
  annotations:
    key: value
spec:
  # ── Access Modes ─────────────────────────────────────────────────────────
  accessModes:                        # []string, at least one required
    - string                          # ReadWriteOnce (RWO) — single node read-write
                                      # ReadOnlyMany  (ROX) — multi-node read-only
                                      # ReadWriteMany (RWX) — multi-node read-write
                                      # ReadWriteOncePod (RWOP) — single pod read-write

  # ── Storage Request ──────────────────────────────────────────────────────
  resources:
    requests:
      storage: string                 # required, e.g. "10Gi", "500Mi"
    limits:
      storage: string                 # optional upper bound

  # ── Storage Class ────────────────────────────────────────────────────────
  storageClassName: string            # "" = no dynamic provisioning
                                      # omit = use default StorageClass

  # ── Volume Mode ──────────────────────────────────────────────────────────
  volumeMode: string                  # Filesystem (default) | Block

  # ── Selector (bind to specific PV) ──────────────────────────────────────
  selector:
    matchLabels:                      # map[string]string
      key: value
    matchExpressions:                 # []LabelSelectorRequirement
      - key: string
        operator: string              # In | NotIn | Exists | DoesNotExist
        values:
          - string

  # ── Bind to specific PV ─────────────────────────────────────────────────
  volumeName: string                  # bind to a specific PersistentVolume by name

  # ── Data Source (cloning / snapshots) ────────────────────────────────────
  dataSource:
    kind: string                      # PersistentVolumeClaim | VolumeSnapshot
    name: string
    apiGroup: string                  # "" for PVC, "snapshot.storage.k8s.io" for snapshot

  dataSourceRef:                      # cross-namespace or custom data sources
    kind: string
    name: string
    apiGroup: string
    namespace: string
```

---

## 7. PersistentVolume (PV)

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: string                        # required, cluster-scoped (no namespace)
  labels:
    key: value
  annotations:
    key: value
spec:
  # ── Capacity ─────────────────────────────────────────────────────────────
  capacity:
    storage: string                   # required, e.g. "100Gi"

  # ── Access Modes ─────────────────────────────────────────────────────────
  accessModes:                        # same as PVC
    - string                          # ReadWriteOnce | ReadOnlyMany | ReadWriteMany
                                      # | ReadWriteOncePod

  # ── Volume Mode ──────────────────────────────────────────────────────────
  volumeMode: string                  # Filesystem (default) | Block

  # ── Reclaim Policy ──────────────────────────────────────────────────────
  persistentVolumeReclaimPolicy: string # Retain (default) | Delete | Recycle (deprecated)

  # ── Storage Class ────────────────────────────────────────────────────────
  storageClassName: string

  # ── Mount Options ────────────────────────────────────────────────────────
  mountOptions:                       # []string — e.g. "hard", "nfsvers=4.1"
    - string

  # ── Claim Binding ────────────────────────────────────────────────────────
  claimRef:                           # pre-bind to a specific PVC
    name: string
    namespace: string
    kind: PersistentVolumeClaim
    apiVersion: v1

  # ── Node Affinity ────────────────────────────────────────────────────────
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: string
              operator: string        # In | NotIn | Exists | DoesNotExist | Gt | Lt
              values:
                - string

  # ── Volume Source (exactly one) ──────────────────────────────────────────

  hostPath:
    path: string
    type: string                      # same as pod volume hostPath

  nfs:
    server: string
    path: string
    readOnly: bool

  csi:
    driver: string                    # required
    volumeHandle: string              # required — unique ID from storage system
    readOnly: bool
    fsType: string
    volumeAttributes:
      key: value
    controllerPublishSecretRef:
      name: string
      namespace: string
    nodeStageSecretRef:
      name: string
      namespace: string
    nodePublishSecretRef:
      name: string
      namespace: string
    controllerExpandSecretRef:
      name: string
      namespace: string

  local:
    path: string                      # required — path on node
    fsType: string

  # (legacy/cloud — less common now, CSI preferred)
  awsElasticBlockStore:
    volumeID: string
    fsType: string
    partition: int32
    readOnly: bool
  gcePersistentDisk:
    pdName: string
    fsType: string
    partition: int32
    readOnly: bool
  azureDisk:
    diskName: string
    diskURI: string
    kind: string                      # Managed | Shared | Dedicated
    cachingMode: string               # None | ReadOnly | ReadWrite
    fsType: string
    readOnly: bool
  azureFile:
    secretName: string
    shareName: string
    readOnly: bool
    secretNamespace: string
  iscsi:
    targetPortal: string
    iqn: string
    lun: int32
    fsType: string
    readOnly: bool
    chapAuthDiscovery: bool
    chapAuthSession: bool
    secretRef:
      name: string
```

---

## 8. ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: string                        # required
  namespace: string                   # required
  labels:
    key: value
  annotations:
    key: value

# Auto-mount API token into pods using this SA
automountServiceAccountToken: bool    # default true

# Pre-created secrets to associate (legacy, rarely used in modern k8s)
secrets:                              # []ObjectReference
  - name: string                      # Secret name

# Pull secrets available to pods using this SA
imagePullSecrets:                     # []LocalObjectReference
  - name: string
```

---

## Quick Type-Mapping Cheat Sheet

Use this when translating YAML fields to Go struct fields:

| YAML type             | Go type                  | Notes                                    |
|----------------------|--------------------------|------------------------------------------|
| `string`             | `string`                 |                                          |
| `int32`              | `int32`                  |                                          |
| `int64`              | `int64`                  |                                          |
| `bool`               | `bool`                   |                                          |
| `int32 \| string`    | `string`                 | use `intstr.IntOrString` in k8s, but `string` in your API |
| `map key: value`     | `map[string]string`      |                                          |
| `[]string`           | `[]string`               |                                          |
| `[]Object`           | `[]YourStructType`       |                                          |
| optional scalar      | `*int32`, `*int64`, etc. | use pointer to distinguish zero from unset |
| optional struct      | `*YourStructType`        |                                          |
| resource quantity    | `string`                 | e.g. "100m", "1Gi" — parsed server-side  |
| base64 bytes         | `string`                 | accept plain string, encode in service layer |
