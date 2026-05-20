# Podforge — Complete Product Roadmap

> **"Where your pods come to life."**
>
> Podforge is a developer-friendly, web-based Kubernetes platform that unifies resource management,
> GitOps workflows, and multi-environment promotion — so developers can go from Docker image to
> production without writing YAML or learning complex tooling.

---

## Vision

Most Kubernetes tools are built for platform engineers and DevOps specialists. Podforge is built
for the **application developer** — the person who knows their app, has a Docker image, and just
wants it running reliably across environments.

The end state is a single UI where a developer can:

1. Deploy an app to K8s without writing YAML
2. Connect their GitHub repo and edit manifests visually
3. Trigger promotions across dev → staging → prod via Kargo
4. See real-time health, logs, and sync status from ArgoCD
5. Get plain-English diagnosis when something breaks

No kubectl. No YAML expertise. No switching between 5 different tools.

---

## How Podforge Fits in the Ecosystem

```
┌──────────────────────────────────────────────────────────────────┐
│                         PODFORGE                                 │
│                                                                  │
│   Developer-friendly UI that ties everything together            │
│                                                                  │
│   ┌───────────┐    ┌───────────┐                                  │
│   │  GitHub   │    │  ArgoCD   │                                  │
│   │  Repo Mgmt│    │  GitOps   │                                  │
│   └─────┬─────┘    └─────┬─────┘                                  │
│         │                │                                       │
│         └────────────────┘                                       │
│                          │                                       │
│                    K8s API Server                                │
│                          │                                       │
│              ┌───────────┼───────────┐                           │
│              │           │           │                           │
│            DEV       STAGING       PROD                          │
└──────────────────────────────────────────────────────────────────┘
```

| Tool | Role | Podforge's Relationship |
|------|------|------------------------|
| **K8s API** | Runs containers | Podforge talks to it via client-go |
| **ArgoCD** | Syncs Git → Cluster | Podforge shows sync status + triggers syncs via ArgoCD API |
| **GitHub** | Stores manifests (source of truth) | Podforge reads/edits/commits manifests via GitHub API |
| **Prometheus** | Collects metrics | Podforge exposes /metrics + queries pod/node metrics |
| **Grafana** | Visualises metrics | Optional integration for deep dashboards |

---

## Competitive Positioning

| Tool | Primary Audience | Core Strength | Weakness |
|------|-----------------|---------------|----------|
| Headlamp | DevOps / Platform Eng | Extensibility (plugins), CNCF official | No guided creation, no GitOps native |
| Lens | DevOps / Cluster Admin | Desktop IDE feel, all-in-one | Commercial direction, desktop only |
| k9s | Power users | Terminal speed, keyboard driven | Zero UI for non-terminal users |
| Rancher | Platform teams | Full lifecycle — provision + manage | Heavy, complex, enterprise-focused |
| ArgoCD UI | GitOps teams | Git sync status + diff | Not a resource manager, no forms |
| **Podforge** | **App developers** | **Guided deploy + GitOps in one bug-free UI** | **New project, smaller scope initially** |

**Podforge's moat:** No existing tool provides form-based creation + GitHub integration + ArgoCD sync in a single, bug-free developer-friendly interface. Each of those tools is powerful alone — Podforge is the connective tissue.

---

## Phase Overview

| Phase | Theme | Duration (est) | Key Outcome |
|-------|-------|---------------|-------------|
| **1** | Core K8s Resource Management | 6-8 weeks | Full CRUD for all day-to-day K8s resources |
| **2** | Extended Workloads + Live UI | 4-6 weeks | StatefulSets, Jobs, Storage, Nodes, real-time SSE badges |
| **3** | Persistence + Templates | 3-4 weeks | PostgreSQL, saved templates, deployment history |
| **4** | GitHub Integration | 4-5 weeks | OAuth, repo scanning, edit manifests, commit back |
| **5** | ArgoCD Integration | 4-5 weeks | Sync status, manual sync, rollback, app management |
| **6** | Observability | 3-4 weeks | Prometheus, pod/node metrics, log viewer |
| **7** | Advanced Features | Ongoing | Web terminal, Helm, multi-cluster, CRDs, RBAC viz |

---

## Phase 1 — Core K8s Resource Management

> **Goal:** Every K8s resource a developer needs daily has a working list + create + detail flow.
> This phase establishes the foundation — both technically and as a usable product.

### Backend

| Ticket | Feature | Priority | Estimate |
|--------|---------|----------|----------|
| PF-001 | K8s client setup (in-cluster + kubeconfig fallback + context override) | P0 | ✅ Done |
| PF-002 | Gin router + middleware (logging, recovery, CORS) | P0 | ✅ Done |
| PF-003 | Consistent error/response structure | P0 | ✅ Done |
| PF-004 | Pod CRUD (list, get, create, update, delete) | P0 | ✅ Done |
| PF-005 | Pod overview — events, conditions | P1 | ✅ Done |
| PF-006 | Pod log streaming (SSE) | P1 | ✅ Done |
| PF-007 | Deployment CRUD (list, get, create, update, delete) | P0 | ✅ Done |
| PF-008 | Deployment overview — ReplicaSets, events | P1 | ✅ Done |
| PF-009 | Service CRUD (list, get, create, update, delete) | P1 | ✅ Done |
| PF-010 | ConfigMap CRUD | P1 | ✅ Done |
| PF-011 | Secret CRUD (values redacted in responses) | P1 | ✅ Done |
| PF-012 | Dashboard — cluster summary, pod phase distribution | P1 | ✅ Done |
| PF-013 | Dashboard — per-namespace resource overview | P2 | ✅ Done |
| PF-014 | Bulk delete + apply | P2 | ✅ Done |
| PF-015 | SSE event stream (cluster events) | P1 | ✅ Done |
| PF-016 | Generic resource watch via SSE | P2 | ✅ Done |
| PF-017 | Global cross-namespace search | P2 | ✅ Done |
| PF-018 | Namespace CRUD (list, create, delete) | P1 | ✅ Done |
| PF-019 | Deployment scale endpoint | P1 | ✅ Done |
| PF-020 | Deployment restart / rollout endpoint | P1 | ✅ Done |
| PF-021 | YAML validate endpoint | P2 | Planned |
| PF-022 | YAML apply from raw input endpoint | P1 | Planned |
| PF-023 | YAML download endpoint | P2 | Planned |
| PF-024 | Dynamic YAML config file (`podforge.yaml`) with env-var override layer | P1 | ✅ Done |

### Frontend

| Ticket | Feature | Priority | Estimate |
|--------|---------|----------|----------|
| PF-030 | React + TS + Mantine scaffold | P0 | ✅ Done |
| PF-031 | TanStack Query + typed API clients | P0 | ✅ Done |
| PF-032 | Dashboard page (summary cards, pod phase chart) | P1 | ✅ Done |
| PF-033 | Pods list page (filtering, bulk actions) | P1 | ✅ Done |
| PF-034 | Pod detail drawer (conditions, events) | P1 | ✅ Done |
| PF-035 | Deployments list page | P1 | ✅ Done |
| PF-036 | ConfigMaps list page | P1 | ✅ Done |
| PF-037 | ManifestDrawer with Monaco YAML editor | P1 | ✅ Done |
| PF-038 | Form-based creation — Pod, Deployment, ConfigMap | P1 | ✅ Done |
| PF-039 | Shared ResourceListPage + ResourcePageHeader | P2 | ✅ Done |
| PF-040 | Services list page + ServiceManifestForm | P1 | ✅ Done |
| PF-041 | Secrets list page + SecretManifestForm + reveal-on-click | P1 | ✅ Done |
| PF-042 | Namespaces page — list, create, delete with resource count | P1 | ✅ Done |
| PF-043 | Deployment detail drawer — scale slider, restart button | P1 | ✅ Done |
| PF-044 | Resource sort (name, age, status) on all list pages | P2 | Planned |
| PF-045 | YAML apply from Monaco editor | P1 | Planned |
| PF-046 | YAML download button | P2 | Planned |

### Phase 1 Definition of Done
- [ ] All K8s resource types a developer uses daily have full CRUD via API and UI
- [ ] Deployment scale and restart work end-to-end
- [ ] YAML can be applied from the editor and downloaded as a file
- [ ] Namespace switcher works across all pages
- [ ] All errors return consistent JSON shapes

---

## Phase 2 — Extended Workloads + Live UI

> **Goal:** Cover remaining K8s workload types. Make the UI reflect real-time cluster state
> without manual refresh.

### Backend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-050 | StatefulSet CRUD | P1 |
| PF-051 | DaemonSet CRUD | P1 |
| PF-052 | ReplicaSet list (read-only) | P2 |
| PF-053 | Job CRUD | P1 |
| PF-054 | CronJob CRUD | P1 |
| PF-055 | PersistentVolume list | P2 |
| PF-056 | PersistentVolumeClaim CRUD | P1 |
| PF-057 | StorageClass list | P2 |
| PF-058 | Ingress CRUD | P1 |
| PF-059 | Endpoints list | P2 |
| PF-060 | Node list + detail (capacity, conditions, taints) | P1 |

### Frontend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-065 | StatefulSet, DaemonSet, Job, CronJob list pages + forms | P1 |
| PF-066 | PVC list page + create form | P1 |
| PF-067 | Ingress list page + create form | P1 |
| PF-068 | Nodes list page + detail drawer | P1 |
| PF-069 | Wire SSE watch to all list pages — live status badges | P0 |
| PF-070 | SSE connection health indicator (connected / reconnecting) | P1 |
| PF-071 | Cluster events panel (collapsible sidebar or page) | P1 |
| PF-072 | Event severity colour coding (Warning = amber, Normal = green) | P2 |
| PF-073 | Filter by label selector across list pages | P2 |
| PF-074 | Filter by field (name, status, node) | P2 |
| PF-075 | Secret type selector (Opaque, TLS, DockerConfigJSON) | P2 |
| PF-076 | ConfigMap key-value inline editor | P2 |

### Phase 2 Definition of Done
- [ ] All standard K8s workload types are manageable
- [ ] Every list page updates in real-time via SSE without page refresh
- [ ] Connection loss is clearly indicated and auto-reconnects
- [ ] Cluster events are visible and colour-coded by severity

---

## Phase 3 — Persistence + Templates

> **Goal:** Add PostgreSQL for state that doesn't belong in K8s. Enable saved templates
> and deployment history — features that require a database and that stateless tools like
> Headlamp cannot easily replicate.

### Infrastructure

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-080 | PostgreSQL setup + GORM integration | P0 |
| PF-081 | Database migrations setup (golang-migrate or GORM auto) | P0 |
| PF-082 | Docker-compose updated with PostgreSQL service | P1 |

### Backend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-085 | Deployment templates — save, list, get, delete | P0 |
| PF-086 | Deployment history — log every create/update/delete with metadata | P0 |
| PF-087 | Template categories (Node.js, Python, Java, Go, Custom) | P1 |
| PF-088 | Template variables — parameterise image, port, replicas, env | P1 |
| PF-089 | Cluster profiles — save and switch kubeconfig connections (file-based config done via PF-024; this covers UI + DB persistence) | P2 |

### Frontend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-092 | Template library page — browse, preview, use | P0 |
| PF-093 | "Save as Template" button on any manifest form | P0 |
| PF-094 | "Deploy from Template" flow — pick template → customise → deploy | P0 |
| PF-095 | Deployment history page — timeline view with diff | P1 |
| PF-096 | Cluster profile switcher in nav | P2 |

### Pre-built Templates to Ship With
```
Node.js Standard    → port 3000, NODE_ENV, health check /healthz
Python Flask        → port 5000, FLASK_ENV, gunicorn workers
Java Spring Boot    → port 8080, JAVA_OPTS, JVM memory limits
Go Service          → port 8080, minimal resource limits
Static Site (Nginx) → port 80, custom nginx.conf via ConfigMap
Redis               → port 6379, persistence volume
PostgreSQL          → port 5432, PVC for data, secret for password
```

### Phase 3 Definition of Done
- [ ] PostgreSQL is running and migrations work
- [ ] Templates can be saved, browsed, and deployed
- [ ] Every deployment action is logged with timestamp and metadata
- [ ] At least 5 pre-built templates ship with the app
- [ ] Cluster profiles allow switching between Minikube / K3s / cloud clusters

---

## Phase 4 — GitHub Integration

> **Goal:** Connect Podforge to GitHub. Developers can browse their repo's K8s manifests,
> edit them in Monaco, and commit changes back — all from within Podforge.
> This is the first step toward a full GitOps workflow.

### Backend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-100 | GitHub OAuth flow (authorize + callback + token storage) | P0 |
| PF-101 | List user's GitHub repos | P0 |
| PF-102 | Scan repo for K8s manifest files (.yaml/.yml in configurable paths) | P0 |
| PF-103 | Read manifest file content from GitHub | P0 |
| PF-104 | Commit manifest changes back to GitHub (create/update files) | P0 |
| PF-105 | Branch selector — read/write to any branch | P1 |
| PF-106 | Create pull request instead of direct commit (optional) | P1 |
| PF-107 | Webhook receiver — GitHub push events trigger UI refresh | P2 |
| PF-108 | GitLab OAuth + API (same flow, different provider) | P2 |

### Frontend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-112 | "Connect GitHub" button + OAuth redirect | P0 |
| PF-113 | Repo browser — list repos, select one | P0 |
| PF-114 | Manifest file tree — show all .yaml files in repo | P0 |
| PF-115 | Monaco editor for repo manifests — edit in place | P0 |
| PF-116 | Commit dialog — message, branch, direct vs PR | P0 |
| PF-117 | Diff view — unsaved changes vs current file | P1 |
| PF-118 | Branch switcher dropdown | P1 |
| PF-119 | "Repo linked" indicator on dashboard | P2 |

### The Full Flow
```
1. Developer clicks "Connect GitHub" → OAuth flow
2. Selects repo → Podforge scans for /k8s, /deploy, /manifests folders
3. File tree appears — click any .yaml file
4. Opens in Monaco editor — edit freely
5. Click "Commit" → enters commit message
6. Podforge commits to GitHub via API
7. (Phase 5) ArgoCD detects the commit → syncs to cluster
```

### Technical Notes
```go
// Key dependency
import "github.com/google/go-github/v57/github"

// Scan for manifest files
GET /api/v1/github/repos/:owner/:repo/manifests
→ returns [{path: "k8s/deployment.yaml", sha: "abc123", size: 1024}]

// Read file
GET /api/v1/github/repos/:owner/:repo/files/:path
→ returns {content: "apiVersion: apps/v1\n...", sha: "abc123"}

// Commit change
PUT /api/v1/github/repos/:owner/:repo/files/:path
Body: {content: "...", message: "update replicas to 3", sha: "abc123", branch: "main"}
```

### Phase 4 Definition of Done
- [ ] GitHub OAuth works end-to-end
- [ ] Repo manifests are browsable and editable in Monaco
- [ ] Changes can be committed directly or via PR
- [ ] Branch switching works
- [ ] Commit history is visible for each file

---

## Phase 5 — ArgoCD Integration

> **Goal:** Connect Podforge to ArgoCD. Show sync status, trigger manual syncs,
> view application health, and rollback — all from Podforge's UI.
> Combined with Phase 4 (GitHub), this completes the GitOps edit → commit → sync loop.

### Backend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-120 | ArgoCD connection setup (server URL + auth token) | P0 |
| PF-121 | List ArgoCD applications | P0 |
| PF-122 | Get application detail (sync status, health, resources) | P0 |
| PF-123 | Trigger manual sync | P0 |
| PF-124 | Get sync history + revision details | P1 |
| PF-125 | Rollback to specific revision | P1 |
| PF-126 | Get application resource tree (what K8s resources it manages) | P1 |
| PF-127 | SSE for ArgoCD app status changes | P2 |
| PF-128 | Create ArgoCD application from Podforge (repo + path + cluster) | P2 |

### Frontend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-132 | ArgoCD connection settings page | P0 |
| PF-133 | Applications list — name, sync status, health, last synced | P0 |
| PF-134 | Application detail page — resource tree, sync history | P0 |
| PF-135 | "Sync" button with confirmation dialog | P0 |
| PF-136 | Sync status badges (Synced ✅, OutOfSync ⚠️, Unknown ❓) | P0 |
| PF-137 | Health badges (Healthy 💚, Degraded 🟡, Progressing 🔵, Missing 🔴) | P0 |
| PF-138 | Rollback dialog — select revision from history | P1 |
| PF-139 | "Create ArgoCD App" wizard | P2 |
| PF-140 | Real-time sync status updates via SSE | P2 |

### ArgoCD REST API Endpoints Used
```
GET    /api/v1/applications                      → list apps
GET    /api/v1/applications/:name                → app detail
POST   /api/v1/applications/:name/sync           → trigger sync
GET    /api/v1/applications/:name/resource-tree   → resource tree
PUT    /api/v1/applications/:name/rollback        → rollback
```

### The Complete GitOps Loop (Phase 4 + 5 Together)
```
Developer edits manifest in Podforge (Monaco editor)
        │
        ▼
Podforge commits to GitHub via API
        │
        ▼
ArgoCD detects new commit (webhook or polling)
        │
        ▼
ArgoCD syncs Git → K8s cluster
        │
        ▼
Podforge shows updated sync status in real-time
        │
        ▼
If something breaks → Podforge shows health degradation
        │
        ▼
Developer clicks "Rollback" → ArgoCD reverts to previous revision
```

### Phase 5 Definition of Done
- [ ] ArgoCD connection works with token auth
- [ ] All ArgoCD applications are visible with sync + health status
- [ ] Manual sync and rollback work end-to-end
- [ ] Sync status updates in real-time
- [ ] The full loop works: edit in Podforge → commit to GitHub → ArgoCD syncs → status updates in Podforge

---

## Phase 6 — Observability

> **Goal:** Surface cluster health, resource consumption, and structured logs without
> leaving Podforge.

### Backend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-180 | Prometheus metrics endpoint (/metrics) for Podforge itself | P1 |
| PF-181 | Pod CPU/Memory usage (query metrics-server API) | P1 |
| PF-182 | Node CPU/Memory usage | P1 |
| PF-183 | Detect metrics-server availability (graceful fallback) | P1 |
| PF-184 | ResourceQuota list per namespace | P2 |
| PF-185 | LimitRange list per namespace | P2 |
| PF-186 | HPA CRUD (list, get, create, update, delete) | P1 |

### Frontend

| Ticket | Feature | Priority |
|--------|---------|----------|
| PF-190 | Log viewer — follow mode toggle | P0 |
| PF-191 | Log viewer — line-level search and filter | P1 |
| PF-192 | Log viewer — download as .log file | P1 |
| PF-193 | Log viewer — multi-container selector | P1 |
| PF-194 | Log viewer — tail-N selector (50/200/1000/all) | P2 |
| PF-195 | Pod CPU/Memory usage sparkline in list view | P1 |
| PF-196 | Node resource usage cards (capacity vs used) | P1 |
| PF-197 | HPA list page + create form | P1 |
| PF-198 | ResourceQuota display per namespace | P2 |

### Phase 6 Definition of Done
- [ ] Podforge exposes /metrics that Prometheus can scrape
- [ ] Pod and Node CPU/Memory visible when metrics-server is available
- [ ] Log viewer has follow mode, search, download, and container selector
- [ ] HPA is manageable from the UI

---

## Phase 7 — Advanced Features

> **Goal:** Production-grade features for teams scaling their Podforge usage.
> These are additive — each can be built independently.

### Web Terminal (Exec)

| Ticket | Feature |
|--------|---------|
| PF-200 | WebSocket endpoint for container exec |
| PF-201 | xterm.js terminal component in UI |
| PF-202 | Container selector when pod has multiple containers |
| PF-203 | Terminal session management (timeout, cleanup) |

### Port Forwarding

| Ticket | Feature |
|--------|---------|
| PF-205 | Port forward API (start, stop, list active forwards) |
| PF-206 | Port forward UI — select pod, local port, remote port |
| PF-207 | Active port forwards indicator in nav |

### Helm Support

| Ticket | Feature |
|--------|---------|
| PF-210 | List Helm releases |
| PF-211 | Helm chart repo browser |
| PF-212 | Install chart from UI (values editor) |
| PF-213 | Upgrade / rollback Helm release |
| PF-214 | View Helm release history |

### Multi-Cluster

| Ticket | Feature |
|--------|---------|
| PF-220 | Add cluster via kubeconfig upload |
| PF-221 | Cluster switcher in nav header |
| PF-222 | Cluster health summary on home page |
| PF-223 | Side-by-side cluster comparison view |

### RBAC

| Ticket | Feature |
|--------|---------|
| PF-230 | ServiceAccount CRUD |
| PF-231 | Role / ClusterRole list |
| PF-232 | RoleBinding / ClusterRoleBinding list |
| PF-233 | "Who can do what" visualisation |

### CRDs

| Ticket | Feature |
|--------|---------|
| PF-240 | List CustomResourceDefinitions |
| PF-241 | List instances of any CRD |
| PF-242 | Edit CRD instance via YAML editor |

### Networking

| Ticket | Feature |
|--------|---------|
| PF-250 | NetworkPolicy CRUD |
| PF-251 | NetworkPolicy graph visualisation |

### Health Narrative (AI-Assisted Diagnosis)

| Ticket | Feature |
|--------|---------|
| PF-260 | Parse K8s events + pod status → plain English summary |
| PF-261 | Common error pattern matching (ImagePullBackOff, CrashLoopBackOff, OOMKilled) |
| PF-262 | Suggested fix actions based on error pattern |
| PF-263 | Optional LLM integration for deeper analysis |

### OpenTelemetry

| Ticket | Feature |
|--------|---------|
| PF-270 | OTel SDK integration in Go backend |
| PF-271 | Trace every K8s API call with span |
| PF-272 | Export traces to Jaeger / Tempo |
| PF-273 | Structured logs with trace context |

---

## Developer Experience Features (Cross-Cutting)

These are UX improvements that apply across all phases.

| Ticket | Feature | Phase |
|--------|---------|-------|
| PF-300 | Guided first-deploy wizard (step-by-step for new users) | Phase 3 |
| PF-301 | Command palette / quick search (Cmd+K) | Phase 4 |
| PF-302 | Keyboard shortcuts across all pages | Phase 4 |
| PF-303 | Dark mode / Light mode toggle | Phase 2 |
| PF-304 | Notification system (toast for create/delete/sync events) | Phase 2 |
| PF-305 | User preferences persistence (default namespace, theme) | Phase 3 |
| PF-306 | Responsive mobile layout | Phase 5 |
| PF-307 | Onboarding tour for new users | Phase 5 |

---

## API Summary (All Phases)

### Core K8s APIs (Phase 1-2)
```
/health
/api/v1/pod/
/api/v1/deployment/
/api/v1/service/
/api/v1/config-map/
/api/v1/secret/
/api/v1/namespace/
/api/v1/statefulset/
/api/v1/daemonset/
/api/v1/job/
/api/v1/cronjob/
/api/v1/pvc/
/api/v1/pv/
/api/v1/ingress/
/api/v1/node/
/api/v1/hpa/
/api/v1/dashboard/
/api/v1/bulk/
/api/v1/search
/api/v1/events/stream
/api/v1/watch/:kind/:namespace
```

### Persistence APIs (Phase 3)
```
/api/v1/templates/          (CRUD — stored in PostgreSQL)
/api/v1/history/            (deployment history — stored in PostgreSQL)
/api/v1/clusters/           (cluster profiles — stored in PostgreSQL)
```

### GitHub APIs (Phase 4)
```
/api/v1/github/auth
/api/v1/github/callback
/api/v1/github/repos
/api/v1/github/repos/:owner/:repo/manifests
/api/v1/github/repos/:owner/:repo/files/:path
/api/v1/github/repos/:owner/:repo/branches
/api/v1/github/repos/:owner/:repo/pull-requests
```

### ArgoCD APIs (Phase 5)
```
/api/v1/argocd/config                    (connection settings)
/api/v1/argocd/applications              (list, get, create)
/api/v1/argocd/applications/:name/sync   (trigger sync)
/api/v1/argocd/applications/:name/rollback
/api/v1/argocd/applications/:name/tree   (resource tree)
/api/v1/argocd/applications/:name/history
```

---

## Tech Stack (Final State)

| Layer | Technology | Phase Introduced |
|-------|-----------|-----------------|
| Frontend | React + TypeScript | Phase 1 |
| UI Library | Mantine UI | Phase 1 |
| State Management | TanStack Query | Phase 1 |
| Code Editor | Monaco Editor | Phase 1 |
| Terminal | xterm.js | Phase 8 |
| Backend | Go + Gin | Phase 1 |
| K8s SDK | client-go | Phase 1 |
| Database | PostgreSQL + GORM | Phase 3 |
| GitHub SDK | go-github | Phase 4 |
| ArgoCD | REST API (HTTP calls) | Phase 5 |
| Metrics | Prometheus client_golang | Phase 6 |
| Tracing | OpenTelemetry Go SDK | Phase 8 |
| Real-time | SSE (Gin streaming) | Phase 1 |
| Real-time (terminal) | WebSocket (gorilla/websocket) | Phase 8 |
| Local Cluster | Minikube → K3d → K3s | Phase 1 → 3 → 5 |

---

## Decisions Log

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Backend language | Go | Node.js, Java | client-go is native Go, learning goal |
| API style | REST + JSON | gRPC | No CLI, simpler for browser, no proto files |
| Real-time (status) | SSE | WebSocket | One-way sufficient, simpler, auto-reconnect |
| Real-time (terminal) | WebSocket | SSE | Exec needs bidirectional, SSE is one-way |
| Frontend framework | React + TS | Vue, Svelte | Developer's existing experience |
| UI library | Mantine | Shadcn, MUI | Clean defaults, good TypeScript support |
| Database | PostgreSQL | MySQL, SQLite, MongoDB | GORM support, production-grade, JSONB for templates |
| ORM | GORM | sqlx, raw SQL | Most popular Go ORM, good migration support |
| Monorepo | Simple folders | Turborepo, Nx | Only 2 services, no need for heavy tooling |
| GitHub integration | go-github | raw HTTP | Typed, well-maintained, covers full GitHub API |
| ArgoCD integration | REST API | ArgoCD Go client | REST is simpler, no heavy dependency |
| Kargo | Removed from scope | — | Third-party integrations deferred; core K8s features ship first |
| Helm in Phase 7 | Deferred | Early | Complex (chart parsing, hooks), core value is elsewhere |
| No gRPC | Deferred indefinitely | Phase 2 | No CLI component, REST sufficient for all use cases |
| K8s cluster strategy | Minikube → K3d → K3s | Single cluster | Progressive: learn → test → production-like |
| AI diagnosis | Pattern matching first | LLM first | Start rule-based, add LLM optionally later |

---

## Success Metrics

| Metric | Phase 1 Target | Phase 6 Target |
|--------|---------------|----------------|
| Resource types managed | 6 (Pod, Deployment, Service, ConfigMap, Secret, Namespace) | 15+ |
| API endpoints | ~30 | ~80 |
| Time to deploy an app (new user) | < 3 minutes | < 1 minute (with templates) |
| Page load time | < 2 seconds | < 2 seconds |
| SSE reconnect time | < 5 seconds | < 3 seconds |
| YAML generation accuracy | 100% valid kubectl-apply-able | 100% |
| GitHub stars (aspirational) | — | 500+ |