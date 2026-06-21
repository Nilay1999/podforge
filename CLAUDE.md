# CLAUDE.md — Podforge (k8s-orchestrator)

## Project — Podforge

**Elevator Pitch:** "Where your pods come to life."
Podforge is a lightweight, web-based Kubernetes resource manager that allows developers to deploy containerized applications through a UI without writing YAML manually.

### Core Functionality

- **Form-based UI:** Configure Pods, Deployments, Services, ConfigMaps, and Secrets through guided forms.
- **Live YAML Preview:** Real-time manifest generation as forms are filled, with in-browser Monaco editor.
- **Direct Apply:** Uses `client-go` to apply manifests directly to the cluster.
- **Monitoring:** Real-time status updates for all resource types via SSE.
- **Dashboard:** Cluster-wide summary with pod phase distribution and namespace overview.
- **Bulk Operations:** Multi-resource delete and apply in a single request.
- **Global Search:** Cross-namespace resource search by name or label.

---

## Coding Style & Rules

- **No Unnecessary Comments:** Do not add comments unless the logic is exceptionally complex or requires specific architectural context.
- **Standard Go Formatting:** Follow standard `gofmt` and `goimports` conventions.
- **Error Handling:** Always check errors. Use `fmt.Errorf("context: %w", err)` for wrapping.
- **Context:** Always pass `context.Context` to K8s API calls. For long-running watch operations, derive a cancellable child context and defer its cancel.
- **REST standards:** Follow the error shape and HTTP status mapping defined in the API section.
- **Concurrency:** Use `sync.WaitGroup` and `errgroup` for coordinating goroutines. Always recover from panics in goroutines that serve SSE streams to avoid crashing the server.

---

## Tech Stack

- **Backend:** Go + Gin
- **Frontend:** React + TypeScript + Mantine UI + TanStack Query
- **K8s SDK:** `client-go`, `k8s.io/api`, `k8s.io/apimachinery`
- **Real-time:** SSE (Server-Sent Events) for status streaming
- **Editor:** Monaco Editor for YAML preview/editing
- **Local Dev:** Minikube / K3d

---

## Architecture & Structure

```
React UI ───[REST/JSON]──▶ Go Backend (Gin) ───[client-go]──▶ K8s API
   ▲                          │
   └────────[SSE]─────────────┘
```

### Monorepo Layout

```
backend/
  cmd/server/          Entry point
  internal/
    handlers/          HTTP handlers (one per resource kind)
    services/          Business logic + K8s API calls
    builders/          K8s object constructors from request types
    types/             Request/response structs
    routes/            Gin router setup
    middleware/        Logger middleware
    k8s/               client-go clientset init
    store/             User database (Postgres or SQLite)
    config/            App config
    util/              Shared utilities
ui/
  src/
    api/               Axios API clients per resource
    hooks/             TanStack Query hooks
    pages/             Route-level page components
    components/
      forms/           Manifest creation forms per kind
      manifest/        ManifestDrawer + Monaco YAML editor
      pods/            Pod-specific components (detail drawer)
      common/          Shared layout and list page components
    types/             TypeScript types per resource kind
    utils/             Constants and helpers
deployments/           K8s manifests for Podforge itself
```

---

## Complete API Reference

> All endpoints are prefixed with `/api/v1/`.

### Health

| Method | Endpoint  | Description  |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

### Auth

| Method | Endpoint                       | Description                                   |
| ------ | ------------------------------ | --------------------------------------------- |
| POST   | `/api/v1/auth/login`           | Local login (username/password) → JWT         |
| GET    | `/api/v1/auth/me`              | Current identity (username, role, provider)   |
| GET    | `/api/v1/auth/providers`       | Which auth providers are enabled (local/OIDC) |
| GET    | `/api/v1/auth/users/`          | List users (admin)                            |
| POST   | `/api/v1/auth/users/`          | Create user (admin)                           |
| PUT    | `/api/v1/auth/users/:username` | Update user password/role (admin)             |
| DELETE | `/api/v1/auth/users/:username` | Delete user (admin)                           |

All other `/api/v1` routes require a Bearer token (Podforge JWT or OIDC ID token; `?token=` query param supported for SSE). Roles: `viewer` (GET), `editor` (mutations), `admin` (namespaces create/delete, bulk ops, user management). Configured via the `auth:` section in `config.yaml` (see `backend/config.yaml`); `auth.enabled: false` disables auth for local dev.

Local users live in a database (`internal/store`): PostgreSQL when `database.postgres` / `DATABASE_URL` is configured, otherwise a SQLite file (`database.sqlite.path`, default `podforge.db`). `auth.users` in config is a startup seed — inserted only if missing, never overwriting runtime changes.

### Pods

| Method | Endpoint                                   | Description                           |
| ------ | ------------------------------------------ | ------------------------------------- |
| POST   | `/api/v1/pod/`                             | Create a pod                          |
| GET    | `/api/v1/pod/:namespace`                   | List pods in namespace                |
| GET    | `/api/v1/pod/:namespace/:name`             | Get pod details                       |
| GET    | `/api/v1/pod/:namespace/:name/overview`    | Get pod overview (events, conditions) |
| GET    | `/api/v1/pod/:namespace/:name/logs/stream` | Stream pod logs (SSE)                 |
| PUT    | `/api/v1/pod/:namespace/:name`             | Replace/update a pod                  |
| DELETE | `/api/v1/pod/:namespace/:name`             | Delete a pod                          |

### Deployments

| Method | Endpoint                                       | Description                                   |
| ------ | ---------------------------------------------- | --------------------------------------------- |
| POST   | `/api/v1/deployment/`                          | Create a deployment                           |
| GET    | `/api/v1/deployment/:namespace`                | List deployments in namespace                 |
| GET    | `/api/v1/deployment/:namespace/:name`          | Get deployment details                        |
| GET    | `/api/v1/deployment/:namespace/:name/overview` | Get deployment overview (ReplicaSets, events) |
| PUT    | `/api/v1/deployment/:namespace/:name`          | Update a deployment                           |
| DELETE | `/api/v1/deployment/:namespace/:name`          | Delete a deployment                           |

### Services

| Method | Endpoint                           | Description                |
| ------ | ---------------------------------- | -------------------------- |
| POST   | `/api/v1/service/`                 | Create a service           |
| GET    | `/api/v1/service/:namespace`       | List services in namespace |
| GET    | `/api/v1/service/:namespace/:name` | Get service details        |
| PUT    | `/api/v1/service/:namespace/:name` | Update a service           |
| DELETE | `/api/v1/service/:namespace/:name` | Delete a service           |

### ConfigMaps

| Method | Endpoint                              | Description                  |
| ------ | ------------------------------------- | ---------------------------- |
| POST   | `/api/v1/config-map/`                 | Create a ConfigMap           |
| GET    | `/api/v1/config-map/:namespace`       | List ConfigMaps in namespace |
| GET    | `/api/v1/config-map/:namespace/:name` | Get ConfigMap                |
| PUT    | `/api/v1/config-map/:namespace/:name` | Update ConfigMap             |
| DELETE | `/api/v1/config-map/:namespace/:name` | Delete ConfigMap             |

### Secrets

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| POST   | `/api/v1/secret/`                 | Create a Secret                |
| GET    | `/api/v1/secret/:namespace`       | List Secrets (values redacted) |
| GET    | `/api/v1/secret/:namespace/:name` | Get Secret (values redacted)   |
| PUT    | `/api/v1/secret/:namespace/:name` | Update Secret                  |
| DELETE | `/api/v1/secret/:namespace/:name` | Delete Secret                  |

### Nodes

| Method | Endpoint              | Description                                       |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/api/v1/node/`       | List nodes (cluster-scoped)                      |
| GET    | `/api/v1/node/:name`  | Get node detail (capacity, conditions, taints)   |

### Dashboard

| Method | Endpoint                                | Description                    |
| ------ | --------------------------------------- | ------------------------------ |
| GET    | `/api/v1/dashboard/summary`             | Cluster-wide resource counts   |
| GET    | `/api/v1/dashboard/pod-phases`          | Pod phase distribution         |
| GET    | `/api/v1/namespace/:namespace/overview` | Per-namespace resource summary |

### Bulk Operations

| Method | Endpoint              | Description               |
| ------ | --------------------- | ------------------------- |
| POST   | `/api/v1/bulk/delete` | Delete multiple resources |
| POST   | `/api/v1/bulk/apply`  | Apply multiple resources  |

### YAML Apply

| Method | Endpoint        | Description                                                                              |
| ------ | --------------- | ---------------------------------------------------------------------------------------- |
| POST   | `/api/v1/apply` | Apply raw YAML (multi-document); `dryRun: true` validates server-side without persisting |

### Real-Time Streaming (SSE)

| Method | Endpoint                         | Description                            |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/api/v1/events/stream`          | Cluster events stream (warning/normal) |
| GET    | `/api/v1/watch/:kind/:namespace` | Watch any resource kind in a namespace |

### Search

| Method | Endpoint                       | Description                     |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/api/v1/search?q=&namespace=` | Cross-namespace resource search |

**SSE Event Format:**

```
event: pod_added
data: {"name": "nginx", "namespace": "default", "phase": "Running"}

event: pod_modified
data: {"name": "nginx", "namespace": "default", "phase": "Pending"}

event: pod_deleted
data: {"name": "nginx", "namespace": "default"}
```

**Error Shape:** `{"code": 404, "message": "Reason", "detail": "Raw error string"}`

---

## Feature Parity & Roadmap

> Compiled from: **Lens**, **Headlamp**, **k9s**, **Rancher**, **Kubernetes Dashboard**, **Octant** (archived), **Monokle**
> Status legend: ✅ Done | 🔧 In Progress | 📋 Planned (Basic) | 🚀 Planned (Advanced) | ❌ Out of Scope

---

### 1. Workloads

| Feature                                      | Source Tools                 | Status     | Phase |
| -------------------------------------------- | ---------------------------- | ---------- | ----- |
| List Pods — status, IP, node, age            | All                          | ✅ Done    | —     |
| Pod detail — containers, labels, annotations | Lens, Headlamp               | ✅ Done    | —     |
| Pod conditions + events                      | Headlamp, Rancher            | ✅ Done    | —     |
| Create Pod via form                          | Podforge                     | ✅ Done    | —     |
| Update / Delete Pod                          | All                          | ✅ Done    | —     |
| Stream Pod logs (SSE)                        | Lens, Headlamp, k9s          | ✅ Done    | —     |
| Log follow mode (tail -f)                    | Lens, k9s                    | 📋 Planned | 3     |
| Log search and filter                        | Lens, k9s                    | 📋 Planned | 3     |
| Log download as file                         | Lens, Headlamp               | 📋 Planned | 3     |
| Multi-container log selector                 | Lens, Headlamp               | 📋 Planned | 3     |
| Exec into container (web terminal)           | Lens, Headlamp, k9s          | 🚀 Planned | 5     |
| Port forward from UI                         | Headlamp, k9s                | 🚀 Planned | 5     |
| List Deployments — replicas, ready, age      | All                          | ✅ Done    | —     |
| Deployment detail — ReplicaSets, events      | Lens, Headlamp               | ✅ Done    | —     |
| Create / Update / Delete Deployment          | All                          | ✅ Done    | —     |
| Scale Deployment (replica slider)            | Lens, Headlamp, k9s, Rancher | 📋 Planned | 1     |
| Restart / Rollout Deployment                 | Lens, k9s, Rancher           | 📋 Planned | 1     |
| Rollout history (revision timeline)          | Lens, Rancher                | 🚀 Planned | 4     |
| Rollback Deployment to previous revision     | Lens, Rancher                | 🚀 Planned | 4     |
| List / Create / Delete StatefulSet           | Lens, Headlamp, Rancher      | 📋 Planned | 2     |
| List / Create / Delete DaemonSet             | Lens, Headlamp, Rancher      | 📋 Planned | 2     |
| List ReplicaSets                             | Lens, Headlamp               | 📋 Planned | 2     |
| List / Create / Delete Job                   | Headlamp, Rancher            | 📋 Planned | 2     |
| List / Create / Update / Delete CronJob      | Headlamp, Rancher            | 📋 Planned | 2     |
| Trigger CronJob manually                     | Rancher, k9s                 | 🚀 Planned | 4     |

---

### 2. Service Discovery & Networking

| Feature                                           | Source Tools            | Status         | Phase |
| ------------------------------------------------- | ----------------------- | -------------- | ----- |
| List Services — ClusterIP, NodePort, LoadBalancer | All                     | 📋 Planned     | 1     |
| Create Service via form                           | Rancher, Headlamp       | 📋 Planned     | 1     |
| Update / Delete Service                           | All                     | 🔧 In Progress | 1     |
| Service detail — ports, endpoints, selectors      | Lens, Headlamp          | 📋 Planned     | 1     |
| List Ingress rules                                | Lens, Headlamp, Rancher | 📋 Planned     | 2     |
| Create / Update / Delete Ingress                  | Rancher, Headlamp       | 📋 Planned     | 2     |
| List Endpoints                                    | Headlamp, Lens          | 📋 Planned     | 2     |
| List NetworkPolicies                              | Headlamp, Rancher       | 🚀 Planned     | 5     |
| Create / Update NetworkPolicy                     | Rancher                 | 🚀 Planned     | 5     |
| NetworkPolicy graph visualisation                 | Headlamp plugin         | 🚀 Planned     | 5     |

---

### 3. Configuration

| Feature                                       | Source Tools      | Status         | Phase |
| --------------------------------------------- | ----------------- | -------------- | ----- |
| List / Create / Update / Delete ConfigMap     | All               | ✅ Done        | —     |
| ConfigMap key-value inline editor             | Headlamp, Rancher | 📋 Planned     | 1     |
| List / Create / Update / Delete Secret        | All               | 🔧 In Progress | 1     |
| Reveal Secret values on click (base64 decode) | Headlamp, Rancher | 📋 Planned     | 1     |
| Secret type selector — Opaque, TLS, Docker    | Rancher, Headlamp | 📋 Planned     | 2     |

---

### 4. Storage

| Feature                           | Source Tools                 | Status     | Phase |
| --------------------------------- | ---------------------------- | ---------- | ----- |
| List PersistentVolumes (PV)       | Lens, Headlamp, Rancher, k9s | 📋 Planned | 2     |
| List PersistentVolumeClaims (PVC) | All                          | 📋 Planned | 2     |
| Create PVC via form               | Rancher, Headlamp            | 📋 Planned | 2     |
| Delete PVC                        | All                          | 📋 Planned | 2     |
| PVC status — Bound, Pending, Lost | All                          | 📋 Planned | 2     |
| List StorageClasses               | Lens, Headlamp, Rancher      | 📋 Planned | 2     |
| PV / PVC binding visualisation    | Headlamp                     | 🚀 Planned | 5     |

---

### 5. Cluster & Namespace Management

| Feature                                                 | Source Tools            | Status     | Phase |
| ------------------------------------------------------- | ----------------------- | ---------- | ----- |
| List Namespaces                                         | All                     | 📋 Planned | 1     |
| Create / Delete Namespace                               | Lens, Headlamp, Rancher | 📋 Planned | 1     |
| Per-namespace resource summary                          | Rancher, Headlamp       | ✅ Done    | —     |
| Namespace switcher in UI nav                            | All                     | 📋 Planned | 1     |
| List Nodes                                              | All                     | ✅ Done    | —     |
| Node detail — capacity, allocatable, taints, conditions | Lens, Headlamp, Rancher | ✅ Done    | —     |
| Node CPU / Memory usage                                 | Lens, Headlamp          | 📋 Planned | 2     |
| Cordon / Uncordon Node                                  | k9s, Rancher            | 🚀 Planned | 5     |
| Drain Node                                              | k9s, Rancher            | 🚀 Planned | 5     |
| List ResourceQuotas per namespace                       | Headlamp, Rancher, Lens | 📋 Planned | 3     |
| List LimitRanges per namespace                          | Headlamp, Rancher       | 📋 Planned | 3     |

---

### 6. RBAC & Access Control

| Feature                                   | Source Tools              | Status     | Phase |
| ----------------------------------------- | ------------------------- | ---------- | ----- |
| List ServiceAccounts                      | Lens, Headlamp, Rancher   | 🚀 Planned | 4     |
| Create / Delete ServiceAccount            | Rancher, Headlamp         | 🚀 Planned | 4     |
| List Roles and ClusterRoles               | Lens, Headlamp, Rancher   | 🚀 Planned | 4     |
| List RoleBindings and ClusterRoleBindings | Lens, Headlamp, Rancher   | 🚀 Planned | 4     |
| RBAC visualisation — who can do what      | Lens Pro, Headlamp plugin | 🚀 Planned | 5     |

---

### 7. Real-time & Observability

| Feature                                  | Source Tools          | Status     | Phase |
| ---------------------------------------- | --------------------- | ---------- | ----- |
| Cluster events stream — Warning + Normal | All                   | ✅ Done    | —     |
| Watch any resource kind via SSE          | Headlamp, Lens        | ✅ Done    | —     |
| Live status badges in all list views     | Lens, Headlamp        | ✅ Done    | —     |
| SSE connection health indicator          | Headlamp              | ✅ Done    | —     |
| Event severity colour coding             | Headlamp, Lens        | ✅ Done    | —     |
| Pod phase distribution chart             | Lens, Headlamp        | ✅ Done    | —     |
| Pod CPU / Memory usage (metrics-server)  | Lens, Headlamp, k9s   | 📋 Planned | 5     |
| Node CPU / Memory usage charts           | Lens, Headlamp        | 📋 Planned | 5     |
| Prometheus metrics endpoint (`/metrics`) | Lens, Headlamp plugin | 📋 Planned | 5     |
| Grafana dashboard integration            | Lens plugin           | 🚀 Planned | 5     |
| OpenTelemetry tracing                    | None natively         | 🚀 Planned | 5     |

---

### 8. YAML Workflow

| Feature                                    | Source Tools      | Status     | Phase |
| ------------------------------------------ | ----------------- | ---------- | ----- |
| YAML preview from form (Monaco, read-only) | Monokle, Podforge | ✅ Done    | —     |
| Monaco YAML editor (editable)              | Podforge          | ✅ Done    | —     |
| Apply raw YAML from editor                 | Headlamp, Rancher | 📋 Planned | 4     |
| YAML schema validation (K8s OpenAPI spec)  | Monokle, Rancher  | 📋 Planned | 4     |
| Download YAML as file                      | Monokle, Headlamp | ✅ Done    | —     |
| Bulk apply multiple YAML resources         | Rancher, Headlamp | ✅ Done    | —     |
| YAML diff view — current vs proposed       | Rancher           | ✅ Done    | —     |
| Helm chart install from UI                 | Rancher, Lens     | 🚀 Planned | 5     |
| Helm release list / upgrade / rollback     | Rancher, Lens     | 🚀 Planned | 5     |

---

### 9. Search & Navigation

| Feature                                      | Source Tools        | Status     | Phase |
| -------------------------------------------- | ------------------- | ---------- | ----- |
| Global cross-namespace resource search       | Lens, Headlamp      | ✅ Done    | —     |
| Filter by label selector                     | Lens, Headlamp, k9s | 📋 Planned | 2     |
| Filter by field — name, status, node         | k9s, Headlamp       | 📋 Planned | 2     |
| Sort resources by name, age, status          | Headlamp, Rancher   | 📋 Planned | 1     |
| Command palette / quick navigation           | Headlamp, Lens      | 🚀 Planned | 4     |
| Resource relationship visualisation graph    | Headlamp, Octant    | 🚀 Planned | 5     |
| Cross-namespace resource grouping (Projects) | Headlamp 2025       | 🚀 Planned | 5     |

---

### 10. Multi-Cluster Support

| Feature                             | Source Tools            | Status     | Phase |
| ----------------------------------- | ----------------------- | ---------- | ----- |
| Add cluster via kubeconfig upload   | Lens, Headlamp, Rancher | 🚀 Planned | 4     |
| Switch between clusters in UI       | Lens, Headlamp, Rancher | 🚀 Planned | 4     |
| Cluster health summary on home page | Rancher, Lens           | 🚀 Planned | 4     |
| Side-by-side cluster comparison     | Headlamp 2025           | 🚀 Planned | 5     |

---

### 11. HPA & Autoscaling

| Feature                                          | Source Tools            | Status     | Phase |
| ------------------------------------------------ | ----------------------- | ---------- | ----- |
| List HorizontalPodAutoscalers                    | Lens, Headlamp, Rancher | 📋 Planned | 5     |
| HPA detail — min, max, current replicas, metrics | Lens, Headlamp          | 📋 Planned | 5     |
| Create / Update / Delete HPA                     | Rancher, Headlamp       | 📋 Planned | 5     |
| List VerticalPodAutoscalers (VPA)                | Rancher                 | 🚀 Planned | 5     |

---

### 12. Custom Resources (CRDs)

| Feature                           | Source Tools        | Status     | Phase |
| --------------------------------- | ------------------- | ---------- | ----- |
| List CustomResourceDefinitions    | Lens, Headlamp, k9s | 🚀 Planned | 4     |
| List instances of a CRD           | Lens, Headlamp, k9s | 🚀 Planned | 4     |
| Edit CRD instance via YAML editor | Headlamp, Lens      | 🚀 Planned | 4     |

---

## Phase Delivery Summary

| Phase | Theme                  | Key Deliverables                                                                       |
| ----- | ---------------------- | -------------------------------------------------------------------------------------- |
| **1** | Complete Core          | Namespace CRUD, Service UI, Secrets UI, Deployment scale + restart, resource sort      |
| **2** | Live Cluster Awareness | SSE live badges on all list views, cluster events panel, connection health indicator   |
| **3** | Log Viewer             | Follow mode, container selector, tail-N, search/filter, download, timestamp toggle     |
| **4** | YAML Workflow          | Apply raw YAML from editor, K8s schema validation, diff view (current vs proposed)     |
| **5** | Observability          | Prometheus `/metrics`, pod/node CPU+Memory, ResourceQuota, LimitRange, Nodes list, HPA |
| **6** | Extended Workloads     | StatefulSet, DaemonSet, Job, CronJob, PVC/PV/StorageClass, Ingress, Endpoints          |
| **7** | Power User             | Rollout history + rollback, command palette, CRD browser, RBAC list, multi-cluster     |
| **8** | Advanced               | Web terminal (exec), port forward, Helm, NetworkPolicy graph, Grafana, OpenTelemetry   |

---

## Implementation Status

### Backend

- [x] Project initialization & K8s client setup
- [x] Gin router with middleware (logging, recovery)
- [x] Consistent error/response structure
- [x] Pod endpoints (list, get, create, update, delete, logs stream, overview)
- [x] Deployment endpoints (list, get, create, update, delete, overview)
- [x] Service endpoints (list, get, create, update, delete)
- [x] ConfigMap endpoints (list, get, create, update, delete)
- [x] Secret endpoints (list, get, create, update, delete — values redacted)
- [x] Dashboard endpoints (summary, pod-phases, namespace overview)
- [x] Bulk delete and apply
- [x] Authentication (local JWT login + OIDC token verification) and role-based authorization (viewer/editor/admin)
- [x] SSE event stream (cluster events)
- [x] Generic resource watch (SSE)
- [x] Global search
- [x] Namespace CRUD endpoints
- [x] Node list + detail endpoints (read-only, cluster-scoped)
- [x] Deployment scale endpoint
- [x] Deployment restart (rollout) endpoint
- [x] YAML validate + apply endpoint (`POST /api/v1/apply` — multi-document, `dryRun` server-side validation)
- [ ] Prometheus metrics endpoint

### Frontend

- [x] React + TypeScript + Mantine UI scaffold
- [x] TanStack Query integration with typed API clients
- [x] Dashboard page (summary cards, pod phase chart)
- [x] Pods list page (filtering, bulk actions)
- [x] Pod detail drawer (conditions, events, basic log streaming tab)
- [x] Deployments list page
- [x] ConfigMaps list page
- [x] ManifestDrawer with Monaco YAML editor
- [x] Form-based manifest creation (Pod, Deployment, ConfigMap)
- [x] Shared ResourceListPage and ResourcePageHeader components
- [x] Services list page + form
- [x] Secrets list page + form
- [x] Namespaces management page
- [x] Nodes list page + detail drawer (status, roles, capacity/allocatable, conditions, taints)
- [x] Deployment detail drawer (scale, restart, ReplicaSet timeline)
- [x] Log viewer enhancements — follow toggle, container selector, tail-N, search/filter, download
- [x] SSE integration — live status badges + connection health across all list pages
- [x] Cluster Events page (live stream from `/events/stream`, severity colouring, filters)
- [x] Auth integration — login page (local + OIDC PKCE), Bearer interceptor, `?token=` on SSE, 401 → login redirect, user menu with logout
- [ ] Global search UI (command palette)
- [x] YAML apply from editor (Apply YAML drawer in header — validate via dry-run + apply)

---

## Roadmap

> Sprint phases — used for branch naming (e.g. `feat/phase-3`). Phase groupings in the Feature Parity table above are long-term milestones aligned with the same numbering.

### Phase 1 — Complete Core Resource Coverage

Goal: every resource kind has a working list + create + detail flow in the UI.

**Backend** (Services, Secrets, Dashboard, Bulk, SSE, Search are 100% complete)

- [x] Namespace CRUD endpoints (`GET/POST/DELETE /api/v1/namespaces/`)
- [x] Deployment scale (`PATCH /api/v1/deployment/:namespace/:name/scale`)
- [x] Deployment restart (`POST /api/v1/deployment/:namespace/:name/restart`)
- [x] Wire YAML apply endpoint (`POST /api/v1/apply`)

**Frontend**

- [x] Services page: list table + `ServiceManifestForm` + API client (`api/services.ts`) + hooks (`hooks/useServices.ts`)
- [x] Secrets page: list table (values masked) + `SecretManifestForm` + reveal-on-click for base64 values
- [x] Namespaces page: list + create + delete with resource count badge
- [x] Deployment detail drawer: scale, restart button, ReplicaSet history timeline

### Phase 2 — Live Cluster Awareness

Goal: UI reflects real-time cluster state without manual refresh.

- [x] Wire SSE watch endpoint to all list pages — rows update/appear/disappear live
- [x] Pod status badge with phase-color pulsing animation when `Pending`
- [x] Cluster events panel (dedicated `/events` page) fed from `/api/v1/events/stream`
- [x] SSE connection health indicator (connected / reconnecting)

### Phase 3 — Log Viewer (In Progress)

Goal: first-class log experience comparable to `kubectl logs`.

Backend already supports `?follow=true`, `?tail=N`, `?container=name`, `?previous=true` on the log stream endpoint. `PodDetailDrawer` has a basic streaming log tab (SSE, auto-scroll, 500-line buffer). Phase 3 enhances it:

- [x] Follow-mode toggle button (switches `?follow=true`; re-opens EventSource on toggle)
- [x] Container selector dropdown (populated from `pod.spec.containers`; passes `?container=name`)
- [x] Tail-N selector — 50 / 200 / 1000 / all (passes `?tail=N`; re-opens EventSource on change)
- [x] Line-level search / filter (client-side; hides non-matching lines)
- [x] Download logs as `.log` file (client-side Blob from buffered line array)
- [x] Previous container logs toggle (`?previous=true`)

### Phase 4 — YAML Workflow

Goal: power users can paste and apply raw YAML without forms.

- [x] "Apply YAML" button in header opens editor drawer (validate + apply, multi-document)
- [x] Backend validates YAML via server-side dry-run before applying
- [x] Diff view: current resource YAML vs. proposed change (read-only left pane)
- [x] Download current resource YAML as `.yaml` file

### Phase 5 — Observability

Goal: surface cluster health without leaving Podforge.

- [ ] Prometheus metrics endpoint (`/metrics`) on backend
- [ ] ResourceQuota / LimitRange display per namespace
- [x] Node list page: status, capacity, allocatable, taints, conditions
- [ ] Pod CPU / Memory usage charts (requires metrics-server in cluster)
- [ ] Basic HPA (HorizontalPodAutoscaler) list and detail view

---

## Decisions Log

- **Why Go?** Native `client-go` support and concurrency primitives (goroutines/channels).
- **Why REST not gRPC?** Simpler for browser-based UI. No CLI component sharing the same API contract.
- **Why SSE not WebSocket (for now)?** Sufficient for one-way status streaming. WebSocket added in Phase 5 for exec/terminal only.
- **Why multiple scoped watch endpoints?** Reduces client-side filtering; enables fine-grained connection management.
- **Secrets redaction:** Values returned as `[REDACTED]`. Reveal-on-click decodes base64 client-side — no server round-trip.
- **API versioning (`/api/v1/`):** Allows future `/api/v2/` without breaking existing consumers.
- **Builder pattern:** `builders/` keeps handlers thin. K8s object construction is isolated and independently testable.
- **Metrics-server dependency:** Pod/Node CPU+Memory metrics require metrics-server in cluster. Podforge detects its absence and hides metric views gracefully.
- **No Helm in Phase 1-5:** Helm adds significant complexity (chart parsing, release state, hooks). Deferred to Phase 8 once core resource management is solid.
