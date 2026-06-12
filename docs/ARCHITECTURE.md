# PodForge — Architecture Diagrams

---

## 1. System Overview

```mermaid
graph TB
    subgraph Browser["Browser"]
        UI["React 19 + Vite\n:5173 (dev)"]
    end

    subgraph PodForge["PodForge Backend  :8080"]
        GIN["Gin Router"]
        MW["Middleware\n(Zap Logger, Recovery)"]
        ROUTES["routes.Setup()"]

        subgraph Handlers["Handlers Layer"]
            DH["deployment_handler"]
            PH["pod_handler"]
            SH["service_handler"]
            CMH["configmap_handler"]
            SCH["secret_handler"]
            NSH["namespace_handler"]
            DASH["dashboard_handler"]
            OVH["overview_handler"]
            LH["log_handler"]
            WH["watch_handler"]
            BLK["bulk_handler"]
            SRCH["search_handler"]
        end

        subgraph Services["Services Layer"]
            DS["DeploymentService"]
            PS["PodService"]
            SS["KubernetesService"]
            CS["ConfigmapService"]
            SEC["SecretService"]
            NS["NamespaceService"]
            DSVC["DashboardService"]
            OVS["OverviewService"]
            LS["LogService"]
            WS["WatchService"]
            BS["BulkService"]
            AS["ApplyService"]
            SSVC["SearchService"]
        end

        subgraph Builders["Builders Layer"]
            DB["deployment.go"]
            PB["pod.go"]
            SB["service.go"]
            CMB["configmap.go"]
            SECB["secret.go"]
            CB["common.go"]
        end

        CFG["config.go\nconfig.yaml / env"]
        K8SCLIENT["k8s/client.go\nclient-go clientset"]
    end

    subgraph Kubernetes["Kubernetes Cluster"]
        KAPI["K8s API Server"]
        subgraph Resources["Resources"]
            KDEP["Deployments"]
            KPOD["Pods"]
            KSVC["Services"]
            KCM["ConfigMaps"]
            KSEC["Secrets"]
            KNS["Namespaces"]
        end
        KEVT["Events"]
    end

    UI -- "REST  /api/v1/*" --> GIN
    UI -- "SSE  /api/v1/watch/:kind/:ns" --> GIN
    UI -- "SSE  /api/v1/pod/:ns/:name/logs/stream" --> GIN
    UI -- "SSE  /api/v1/events/stream" --> GIN

    GIN --> MW --> ROUTES
    ROUTES --> Handlers
    Handlers --> Services
    Services --> Builders
    Services --> K8SCLIENT
    K8SCLIENT -- "client-go" --> KAPI
    KAPI --> Resources
    KAPI --> KEVT
    CFG --> K8SCLIENT
```

---

## 2. Backend Request Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Gin as Gin Router
    participant Handler
    participant Service
    participant Builder
    participant K8s as K8s API

    Browser->>Gin: HTTP Request
    Gin->>Gin: Logger Middleware
    Gin->>Gin: Recovery Middleware
    Gin->>Handler: Route match → handler func

    alt Create / Update
        Handler->>Handler: Bind & validate request body
        Handler->>Service: Create(ctx, req)
        Service->>Builder: Build K8s object from req
        Builder-->>Service: k8s.Object
        Service->>K8s: clientset.Create(obj)
        K8s-->>Service: K8s resource
        Service-->>Handler: response struct
    else Read / List
        Handler->>Handler: Extract path params
        Handler->>Service: Get / List(ctx, ns, name)
        Service->>K8s: clientset.Get / List(...)
        K8s-->>Service: K8s resource
        Service-->>Handler: response struct
    else Delete
        Handler->>Service: Delete(ctx, ns, name)
        Service->>K8s: clientset.Delete(...)
        K8s-->>Service: ok
        Service-->>Handler: nil error
    end

    Handler->>Browser: JSON response
```

---

## 3. Frontend Architecture

```mermaid
graph TB
    subgraph Entry["Entry Point"]
        MAIN["main.tsx\nMantineProvider\nQueryClientProvider\nBrowserRouter"]
    end

    subgraph App["App.tsx — React Router"]
        LAYOUT["AppLayout\n(AppShell + Sidebar + Header)"]
        subgraph Pages["Pages  (one per resource kind)"]
            DP["DashboardPage /"]
            DEP["DeploymentsPage /deployments"]
            PP["PodsPage /pods"]
            CP["ConfigMapsPage /configmaps"]
            SVP["ServicesPage /services"]
            SP["SecretsPage /secrets"]
            NP["NamespacesPage /namespaces"]
        end
    end

    subgraph Hooks["Custom Hooks  (React Query)"]
        UD["useDeployments\nuseScaleDeployment\nuseRestartDeployment"]
        UP["usePods"]
        US["useServices"]
        UC["useConfigMaps"]
        USE["useSecrets"]
        UN["useNamespaces"]
        UW["useWatchResource\n(SSE / EventSource)"]
        UEM["useEditManifestDrawer"]
        URH["createResourceHooks (factory)"]
    end

    subgraph API["API Layer  (Axios)"]
        AC["client.ts\nbaseURL /api/v1\nerror interceptor"]
        ADEP["deployments.ts"]
        APOD["pods.ts"]
        ASVC["services.ts"]
        ACM["configmaps.ts"]
        ASEC["secrets.ts"]
        ANS["namespaces.ts"]
    end

    subgraph Components["Components"]
        subgraph Common["common/"]
            AL["AppLayout\nHeader · Sidebar · Shell"]
            RLP["ResourceListPage\nGeneric table + pagination"]
        end
        subgraph Drawers["Drawers"]
            DDD["DeploymentDetailDrawer\nscale · restart · events"]
            PDD["PodDetailDrawer\ncontainers · logs · events"]
            MD["ManifestDrawer\nYAML editor (CodeMirror)"]
        end
        subgraph Forms["forms/"]
            DMF["DeploymentManifestForm"]
            PMF["PodManifestForm"]
            SMF["ServiceManifestForm"]
            CMMF["ConfigMapManifestForm"]
            SECMF["SecretManifestForm"]
            MFF["MetadataFields"]
            KVF["KeyValuePairsField"]
            FD["FormDocs (inline help)"]
        end
        subgraph Manifest["manifest/"]
            ME["ManifestEditor\n(CodeMirror wrapper)"]
            KS["kindStrategies.ts\nYAML ↔ form bridge"]
            ET["editorTheme.ts"]
        end
    end

    MAIN --> App
    App --> LAYOUT --> Pages
    Pages --> Hooks
    Hooks --> API
    API --> AC
    Pages --> Components
    UW -- "EventSource (SSE)" --> AC
```

---

## 4. API Endpoint Map

```mermaid
graph LR
    subgraph V1["/api/v1"]
        subgraph DEP["/deployment"]
            D1["POST /  →  Create"]
            D2["GET /:ns  →  List"]
            D3["GET /:ns/:name  →  Get"]
            D4["GET /:ns/:name/overview  →  Overview"]
            D5["PUT /:ns/:name  →  Update"]
            D6["DELETE /:ns/:name  →  Delete"]
            D7["PATCH /:ns/:name/scale  →  Scale"]
            D8["POST /:ns/:name/restart  →  Restart"]
        end

        subgraph POD["/pod"]
            P1["POST /  →  Create"]
            P2["GET /:ns  →  List"]
            P3["GET /:ns/:name  →  Get"]
            P4["GET /:ns/:name/overview  →  Overview"]
            P5["GET /:ns/:name/logs/stream  →  Log Stream SSE"]
            P6["PUT /:ns/:name  →  Update"]
            P7["DELETE /:ns/:name  →  Delete"]
        end

        subgraph SVC["/service"]
            S1["POST /  →  Create"]
            S2["GET /:ns  →  List"]
            S3["GET /:ns/:name  →  Get"]
            S4["PUT /:ns/:name  →  Update"]
            S5["DELETE /:ns/:name  →  Delete"]
        end

        subgraph CM["/config-map"]
            C1["POST /  →  Create"]
            C2["GET /:ns  →  List"]
            C3["GET /:ns/:name  →  Get"]
            C4["PUT /:ns/:name  →  Update"]
            C5["DELETE /:ns/:name  →  Delete"]
        end

        subgraph SEC["/secret"]
            SE1["POST /  →  Create"]
            SE2["GET /:ns  →  List"]
            SE3["GET /:ns/:name  →  Get"]
            SE4["PUT /:ns/:name  →  Update"]
            SE5["DELETE /:ns/:name  →  Delete"]
        end

        subgraph NS["/namespaces"]
            N1["GET /  →  List"]
            N2["POST /  →  Create"]
            N3["DELETE /:name  →  Delete"]
        end

        subgraph DASH["/dashboard"]
            DA1["GET /summary  →  Cluster stats"]
            DA2["GET /pod-phases  →  Phase distribution"]
        end

        subgraph BLK["/bulk"]
            B1["POST /delete  →  Bulk delete"]
            B2["POST /apply  →  Bulk apply YAML"]
        end

        subgraph UTIL["Utility"]
            U1["GET /namespace/:ns/overview"]
            U2["GET /events/stream  SSE"]
            U3["GET /watch/:kind/:ns  SSE"]
            U4["GET /search?q=..."]
            U5["GET /health"]
        end
    end
```

---

## 5. Real-Time Data Flow (SSE)

```mermaid
sequenceDiagram
    participant UI as React UI
    participant RQ as React Query Cache
    participant UW as useWatchResource
    participant BE as Backend WatchHandler
    participant WS as WatchService
    participant K8s as K8s API

    UI->>RQ: Initial load → useDeployments / usePods / ...
    RQ->>BE: GET /api/v1/deployment/:ns (REST)
    BE-->>RQ: JSON list response
    RQ-->>UI: Render resource list

    UI->>UW: Mount → open EventSource
    UW->>BE: GET /api/v1/watch/:kind/:ns (SSE)
    BE->>WS: WatchService.Resource(ctx, kind, ns)
    WS->>K8s: client-go Watch()
    K8s-->>WS: watch.Event stream

    loop Cluster events
        K8s->>WS: ADDED / MODIFIED / DELETED
        WS->>BE: event
        BE->>UW: SSE text: "deployment_added" / "deployment_modified" / "deployment_deleted"
        UW->>RQ: Patch query cache directly
        RQ->>UI: Re-render with updated data
    end

    Note over UI,K8s: Log streaming follows same pattern via<br/>/api/v1/pod/:ns/:name/logs/stream
```

---

## 6. Service Dependency Graph

```mermaid
graph TD
    ROUTES["routes.Setup()"]

    ROUTES --> DS["DeploymentService\nGet·List·Create·Update·Delete·Scale·Restart"]
    ROUTES --> PS["PodService\nGet·List·Create·Update·Delete"]
    ROUTES --> SS["KubernetesService\nGet·List·Create·Update·Delete"]
    ROUTES --> CS["ConfigmapService\nGet·List·Create·Update·Delete"]
    ROUTES --> SEC["SecretService\nGet·List·Create·Update·Delete"]
    ROUTES --> NS["NamespaceService\nList·Create·Delete"]
    ROUTES --> DSVC["DashboardService\nSummary·PodPhases·NamespaceOverview"]
    ROUTES --> OVS["OverviewService\nDeployment·Pod"]
    ROUTES --> LS["LogService\nStream"]
    ROUTES --> WS["WatchService\nEvents·Resource"]
    ROUTES --> AS["ApplyService\nApply (raw YAML)"]
    ROUTES --> SSVC["SearchService\nSearch"]
    ROUTES --> BS["BulkService\nDelete·Apply"]

    BS --> SS
    BS --> DS
    BS --> PS
    BS --> AS

    DS --> DB["builders/deployment.go"]
    PS --> PB["builders/pod.go"]
    SS --> SB["builders/service.go"]
    CS --> CMB["builders/configmap.go"]
    SEC --> SECB["builders/secret.go"]
    DB & PB & SB & CMB & SECB --> CB["builders/common.go\nshared K8s object helpers"]

    DS & PS & SS & CS & SEC & NS & DSVC & OVS & LS & WS & SSVC --> CLIENTSET["k8s clientset\n(client-go)"]
    AS --> RESTCFG["rest.Config\n(for dynamic client)"]
```

---

## 7. Frontend Component Tree

```mermaid
graph TB
    MAIN["main.tsx\nMantine · QueryClient · Router"]
    APP["App.tsx"]
    LAYOUT["AppLayout\nAppShell"]

    MAIN --> APP --> LAYOUT

    subgraph Header["AppShell.Header"]
        LOGO["Logo + wordmark"]
        CLSEL["Cluster selector button"]
        NSSEL["Namespace selector button"]
        SRCBTN["Search button ⌘K"]
        THEME["Dark/light toggle"]
    end

    subgraph Sidebar["AppShell.Navbar"]
        NAV["NavLinks\nDashboard · Deployments · Pods\nConfigMaps · Services · Secrets · Namespaces"]
        STATUS["Connected status dot + version"]
    end

    LAYOUT --> Header
    LAYOUT --> Sidebar

    subgraph Main["AppShell.Main  (route outlet)"]
        DASH["DashboardPage\nCluster summary · Pod phase donut · Events feed · Quick create"]

        subgraph DEP_PAGE["DeploymentsPage"]
            DEP_TABLE["ResourceListPage table"]
            DEP_DRAWER["DeploymentDetailDrawer\nReplica sets · Managed pods · Scale · Restart"]
            DEP_FORM["ManifestDrawer → DeploymentManifestForm\n(containers · volumes · affinity · probes)"]
        end

        subgraph POD_PAGE["PodsPage"]
            POD_TABLE["ResourceListPage table"]
            POD_DRAWER["PodDetailDrawer\nContainers · Volumes · Events · Logs"]
        end

        subgraph GENERIC_PAGES["ConfigMaps · Services · Secrets · Namespaces"]
            GEN_TABLE["ResourceListPage table"]
            GEN_FORM["ManifestDrawer → resource-specific form"]
        end
    end

    LAYOUT --> Main
```

---

## 8. Data Model & Types

```mermaid
classDiagram
    class Deployment {
        +string Name
        +string Namespace
        +map Labels
        +int32 Replicas
        +Container[] Containers
        +Volume[] Volumes
        +Affinity Affinity
        +Toleration[] Tolerations
    }

    class Pod {
        +string Name
        +string Namespace
        +string Phase
        +string NodeName
        +Container[] Containers
        +Volume[] Volumes
        +PodCondition[] Conditions
    }

    class Container {
        +string Name
        +string Image
        +ContainerPort[] Ports
        +EnvVar[] Env
        +ResourceRequirements Resources
        +Probe LivenessProbe
        +Probe ReadinessProbe
        +VolumeMount[] VolumeMounts
    }

    class Service {
        +string Name
        +string Namespace
        +string Type
        +ServicePort[] Ports
        +map Selector
        +string ClusterIP
    }

    class ConfigMap {
        +string Name
        +string Namespace
        +map~string string~ Data
    }

    class Secret {
        +string Name
        +string Namespace
        +string Type
        +map~string string~ Data
    }

    class Namespace {
        +string Name
        +string Status
        +map Labels
    }

    class DashboardSummary {
        +int RunningPods
        +int FailedPods
        +int PendingPods
        +int TotalDeployments
        +int TotalServices
        +int TotalConfigMaps
        +int TotalSecrets
    }

    Deployment "1" *-- "many" Container
    Pod "1" *-- "many" Container
    Deployment ..> Pod : manages
    Service ..> Pod : selects
```

---

## 9. Configuration & Startup Flow

```mermaid
flowchart TD
    START([main.go starts]) --> CFG

    CFG["config.Load()\nRead config.yaml\n→ ~/.podforge/config.yaml\n→ env var overrides"]

    CFG --> LOG["logger.New(cfg)\nZap logger init"]
    CFG --> K8S["k8s.NewClient(kubeconfig, context)\nTry in-cluster → fallback kubeconfig"]

    K8S --> |success| ROUTES["routes.Setup()\nInstantiate all services\nWire all handlers\nRegister Gin routes"]

    K8S --> |failure| FATAL["log.Fatal — exit"]

    ROUTES --> GIN["r.Run(:8080)\nListen for requests"]

    subgraph Config Priority
        ENV["Env vars  HIGHEST"]
        YAML["config.yaml"]
        HOMEYAML["~/.podforge/config.yaml"]
        DEFAULTS["Built-in defaults  LOWEST"]
        ENV --> YAML --> HOMEYAML --> DEFAULTS
    end
```

---

## 10. Monorepo Structure

```mermaid
graph TD
    ROOT["/ (repo root)\nMakefile · turbo.json · pnpm-workspace.yaml\nconfig.yaml · bruno/"]

    ROOT --> BE["backend/\nGo module: github.com/podforge/backend"]
    ROOT --> UI["ui/\npnpm package: podforge-ui"]
    ROOT --> DOCS["docs/\nROADMAP.md · ARCHITECTURE.md"]
    ROOT --> BRUNO["bruno/\nBruno API collection"]

    BE --> CMD["cmd/server/main.go"]
    BE --> INT["internal/\nconfig · k8s · routes\nhandlers · services · builders\ntypes · middleware · util"]

    UI --> UISRC["src/\nApp.tsx · main.tsx\napi/ · hooks/ · pages/\ncomponents/ · types/\ntheme.ts · utils/"]
    UI --> UICFG["vite.config.ts\ntsconfig.json\npackage.json"]

    subgraph TurboTasks["Turborepo Tasks"]
        DEV["dev — pnpm dev + go run (parallel, persistent)"]
        BUILD["build — go build + vite build"]
        TEST["test — go test ./internal/..."]
        LINT["lint — ESLint + Prettier"]
    end

    ROOT --> TurboTasks
```
