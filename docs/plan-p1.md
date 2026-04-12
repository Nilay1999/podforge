# Incubator — Phase 1 Implementation Plan
> **Goal:** Learn K8s concepts, explore the K8s API, and build core backend APIs for creating and applying manifests via Incubator.

---

## Project Overview

**Incubator** is a web-based Kubernetes resource manager that lets developers deploy containerized applications to a K8s cluster through a UI — without writing YAML manually.

**Stack:**
- Frontend: React + TypeScript
- Backend: Go + Gin
- K8s SDK: client-go
- Local Cluster: Minikube

---

## Phase 1 Scope

Phase 1 is **backend-only and learning-focused**. No React UI yet. The goal is to:

1. Understand core K8s concepts hands-on
2. Explore the K8s API via kubectl and client-go
3. Set up the Go project structure
4. Build REST APIs for creating and managing K8s resources
5. Validate everything works against a real Minikube cluster

---

## Milestones

| Milestone | Description | Tickets |
|-----------|-------------|---------|
| M1 | K8s Fundamentals | INC-001 → INC-004 |
| M2 | Project Setup | INC-005 → INC-007 |
| M3 | Core APIs | INC-008 → INC-013 |
| M4 | Real-time & Validation | INC-014 → INC-016 |

---

## Milestone 1 — K8s Fundamentals (Learning)

> Before writing any code, understand what you're building against. This milestone is pure exploration.

---

### INC-001 — Learn Core K8s Concepts

**Type:** Learning
**Estimate:** 2 days
**Priority:** P0 — Blocker for everything

**What to study:**

| Concept | What it is | Why it matters |
|---------|-----------|----------------|
| Pod | Smallest deployable unit, runs containers | Everything starts here |
| Deployment | Manages pod replicas and rollouts | How you run apps in prod |
| Service | Exposes pods to network (internal/external) | How pods talk to each other |
| Namespace | Logical isolation within a cluster | Organise resources |
| ConfigMap | Store non-sensitive config as key-value | Env vars without hardcoding |
| Secret | Store sensitive config (passwords, tokens) | Never hardcode secrets |
| Ingress | HTTP routing rules to services | Expose apps to the internet |
| Node | Physical/virtual machine in the cluster | Where pods actually run |

**Hands-on tasks:**
- [&check;] Start Minikube: `minikube start`
- [&check;] Deploy nginx manually: `kubectl create deployment nginx --image=nginx`
- [&check;] Expose it: `kubectl expose deployment nginx --port=80 --type=NodePort`
- [&check;] Check pods: `kubectl get pods`
- [&check;] Check services: `kubectl get services`
- [&check;] Describe a pod: `kubectl describe pod <pod-name>`
- [&check;] Delete the deployment: `kubectl delete deployment nginx`

**Resources:**
- https://kubernetes.io/docs/concepts/
- `kubectl explain pod` — built-in docs for any resource

---

### INC-002 — Write K8s Manifests by Hand

**Type:** Learning
**Estimate:** 1 day
**Priority:** P0 — Understand before automating

**Goal:** Write YAML manifests manually so you understand what Incubator will generate programmatically.

**Tasks:**
- [&check;] Write a Pod manifest manually and apply it
- [&check;] Write a Deployment manifest with 2 replicas
- [&check;] Write a Service manifest (ClusterIP and NodePort)
- [&check;] Write a ConfigMap and mount it as env vars in a pod
- [&check;] Apply all of them: `kubectl apply -f <file>.yaml`
- [&check;] Delete them: `kubectl delete -f <file>.yaml`

**Example to write by hand:**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: nginx:latest
          ports:
            - containerPort: 80
```

**Success criteria:** You can apply and delete all resource types without referring to docs.

---

### INC-003 — Explore the K8s REST API Directly

**Type:** Learning + Exploration
**Estimate:** 1 day
**Priority:** P1

**Goal:** Understand what client-go is actually calling under the hood — the raw K8s REST API.

**Tasks:**
- [ ] Start kubectl proxy: `kubectl proxy --port=8001`
- [ ] Call the API directly with curl:

```bash
# List all pods in default namespace
curl http://localhost:8001/api/v1/namespaces/default/pods

# Get a specific pod
curl http://localhost:8001/api/v1/namespaces/default/pods/<pod-name>

# List deployments
curl http://localhost:8001/apis/apps/v1/namespaces/default/deployments

# List all namespaces
curl http://localhost:8001/api/v1/namespaces
```

- [ ] Read the response JSON — understand the structure
- [ ] Notice how it maps 1:1 with `kubectl get pods -o json`
- [ ] Try creating a pod via raw curl (POST with JSON body)

**Key insight:** client-go is just a typed Go wrapper around these HTTP calls. Understanding the raw API makes debugging much easier.

---

### INC-004 — Explore client-go Basics

**Type:** Learning + Spike
**Estimate:** 1 day
**Priority:** P0

**Goal:** Write a standalone Go script (not the full app) that uses client-go to interact with Minikube.

**Tasks:**
- [ ] Create a scratch Go file `scripts/explore/main.go`
- [ ] Connect to Minikube using kubeconfig
- [ ] List all pods in all namespaces and print them
- [ ] List all deployments
- [ ] Create a pod programmatically
- [ ] Delete it after creating it

```go
// scripts/explore/main.go — throwaway exploration file
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/tools/clientcmd"
)

func main() {
    kubeconfig := os.Getenv("HOME") + "/.kube/config"
    config, _ := clientcmd.BuildConfigFromFlags("", kubeconfig)
    client, _ := kubernetes.NewForConfig(config)

    pods, err := client.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        log.Fatal(err)
    }

    for _, pod := range pods.Items {
        fmt.Printf("Pod: %s | Namespace: %s | Status: %s\n",
            pod.Name, pod.Namespace, pod.Status.Phase)
    }
}
```

**Success criteria:** You can list, create, and delete resources using client-go before touching the main app.

---

## Milestone 2 — Project Setup

---

### INC-005 — Initialise Monorepo Structure

**Type:** Setup
**Estimate:** 2 hours
**Priority:** P0

**Tasks:**
- [ ] Create root folder `incubator/`
- [ ] Create all subdirectories as per the agreed structure
- [ ] Initialise Go module: `go mod init github.com/<username>/incubator/backend`
- [ ] Install all Go dependencies:
  - `github.com/gin-gonic/gin`
  - `k8s.io/client-go`
  - `k8s.io/api`
  - `k8s.io/apimachinery`
  - `sigs.k8s.io/yaml`
- [ ] Create root `.gitignore`
- [ ] Initialise git: `git init`
- [ ] Create root `README.md` with project description
- [ ] Create `Makefile` with `run-backend`, `build`, `test` targets

**Deliverable:** Repo is initialised, Go dependencies installed, project runs without errors.

---

### INC-006 — K8s Client Setup

**Type:** Backend
**Estimate:** 3 hours
**Priority:** P0 — Foundation for all backend work

**File:** `backend/internal/k8s/client.go`

**Tasks:**
- [ ] Implement `NewClient()` that:
  - Tries in-cluster config first
  - Falls back to `~/.kube/config` for local dev
  - Reads `KUBECONFIG` env var if set
  - Returns a typed `*kubernetes.Clientset`
- [ ] Add proper error wrapping with `fmt.Errorf("...: %w", err)`
- [ ] Test connection against Minikube manually

**Acceptance criteria:**
- Server starts and logs `✅ Connected to K8s cluster`
- If kubeconfig is missing, a clear error is logged and server exits

---

### INC-007 — Gin Server Skeleton + Health Check

**Type:** Backend
**Estimate:** 2 hours
**Priority:** P0

**File:** `backend/cmd/server/main.go`

**Tasks:**
- [ ] Initialise Gin router
- [ ] Add CORS middleware (React will call from port 5173)
- [ ] Add request logger middleware (Gin default is fine)
- [ ] Add `GET /health` endpoint returning `{ "status": "ok", "service": "incubator" }`
- [ ] Wire K8s client from INC-006 into main
- [ ] Server listens on port `8080` (configurable via `PORT` env var)

**Test:**
```bash
curl http://localhost:8080/health
# Expected: {"status":"ok","service":"incubator"}
```

---

## Milestone 3 — Core APIs

---

### INC-008 — List Pods API

**Type:** Backend
**Estimate:** 3 hours
**Priority:** P1

**Endpoint:** `GET /api/pods?namespace=default`

**File:** `backend/internal/handlers/pod.go`

**Tasks:**
- [ ] Create `PodHandler` struct with `*kubernetes.Clientset`
- [ ] Implement `ListPods` handler
- [ ] Accept `namespace` as query param (default to `"default"`)
- [ ] Return clean JSON — not raw K8s objects (too verbose)
- [ ] Handle errors with proper HTTP status codes

**Response shape:**
```json
{
  "count": 2,
  "pods": [
    {
      "name": "nginx-abc123",
      "namespace": "default",
      "status": "Running",
      "ip": "172.17.0.3",
      "image": "nginx:latest",
      "created_at": "2025-04-10T10:00:00Z"
    }
  ]
}
```

**Test:**
```bash
curl "http://localhost:8080/api/pods?namespace=default"
```

---

### INC-009 — Create Pod API

**Type:** Backend
**Estimate:** 4 hours
**Priority:** P1 — First write operation

**Endpoint:** `POST /api/pods`

**Tasks:**
- [ ] Define `CreatePodRequest` model in `backend/internal/models/pod.go`
- [ ] Validate required fields (name, image, namespace)
- [ ] Build `corev1.Pod` struct from request
- [ ] Call `client.CoreV1().Pods(namespace).Create(...)`
- [ ] Return created pod details
- [ ] Handle conflict errors (pod already exists → 409)

**Request body:**
```json
{
  "name": "my-nginx",
  "namespace": "default",
  "image": "nginx:latest",
  "port": 80,
  "env": {
    "ENV": "production"
  },
  "labels": {
    "app": "my-nginx"
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:8080/api/pods \
  -H "Content-Type: application/json" \
  -d '{"name":"test-pod","namespace":"default","image":"nginx:latest","port":80}'
```

---

### INC-010 — Delete Pod API

**Type:** Backend
**Estimate:** 2 hours
**Priority:** P1

**Endpoint:** `DELETE /api/pods/:name?namespace=default`

**Tasks:**
- [ ] Accept pod name as path param
- [ ] Accept namespace as query param
- [ ] Call `client.CoreV1().Pods(namespace).Delete(...)`
- [ ] Handle not found errors (pod doesn't exist → 404)
- [ ] Return `204 No Content` on success

**Test:**
```bash
curl -X DELETE "http://localhost:8080/api/pods/test-pod?namespace=default"
```

---

### INC-011 — Create Deployment API

**Type:** Backend
**Estimate:** 5 hours
**Priority:** P1 — Core feature

**Endpoint:** `POST /api/deployments`

**Tasks:**
- [ ] Define `CreateDeploymentRequest` model
- [ ] Validate required fields (name, image, namespace, replicas)
- [ ] Build `appsv1.Deployment` struct from request
- [ ] Support env vars, labels, resource limits (optional fields)
- [ ] Call `client.AppsV1().Deployments(namespace).Create(...)`
- [ ] Return deployment details

**Request body:**
```json
{
  "name": "my-app",
  "namespace": "default",
  "image": "nginx:latest",
  "replicas": 2,
  "port": 80,
  "env": {
    "NODE_ENV": "production"
  },
  "labels": {
    "app": "my-app",
    "team": "backend"
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:8080/api/deployments \
  -H "Content-Type: application/json" \
  -d '{"name":"my-app","namespace":"default","image":"nginx:latest","replicas":2,"port":80}'
```

---

### INC-012 — List & Delete Deployment APIs

**Type:** Backend
**Estimate:** 3 hours
**Priority:** P1

**Endpoints:**
- `GET /api/deployments?namespace=default`
- `DELETE /api/deployments/:name?namespace=default`

**Tasks:**
- [ ] Implement `ListDeployments` handler
- [ ] Return clean deployment summary (name, replicas, ready, image, age)
- [ ] Implement `DeleteDeployment` handler
- [ ] Handle 404 on delete for non-existent deployment

**Response shape for list:**
```json
{
  "count": 1,
  "deployments": [
    {
      "name": "my-app",
      "namespace": "default",
      "replicas": 2,
      "ready_replicas": 2,
      "image": "nginx:latest",
      "created_at": "2025-04-10T10:00:00Z"
    }
  ]
}
```

---

### INC-013 — YAML Preview API

**Type:** Backend
**Estimate:** 3 hours
**Priority:** P2

**Endpoint:** `POST /api/yaml/preview`

**Goal:** Accept the same request body as the Create Deployment API, but instead of applying to the cluster, return the generated YAML as a string. This powers the live preview in the UI later.

**File:** `backend/pkg/yaml/generator.go`

**Tasks:**
- [ ] Accept deployment config in request body
- [ ] Build the K8s struct (same as INC-011)
- [ ] Marshal to YAML using `sigs.k8s.io/yaml`
- [ ] Return YAML as plain text response
- [ ] Test that output is valid and `kubectl apply`-able

**Response:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
...
```

**Test:**
```bash
curl -X POST http://localhost:8080/api/yaml/preview \
  -H "Content-Type: application/json" \
  -d '{"name":"my-app","image":"nginx:latest","replicas":2}' \
  | kubectl apply -f -   # pipe directly to kubectl to validate
```

---

## Milestone 4 — Real-time & Polish

---

### INC-014 — Watch Pod Status via SSE

**Type:** Backend
**Estimate:** 5 hours
**Priority:** P2

**Endpoint:** `GET /api/pods/watch?namespace=default`

**Goal:** Stream real-time pod status updates to the client using Server-Sent Events (SSE).

**Tasks:**
- [ ] Set SSE response headers (`Content-Type: text/event-stream`)
- [ ] Use `client-go` Watch API: `client.CoreV1().Pods(ns).Watch(...)`
- [ ] Listen to `watcher.ResultChan()` in a goroutine
- [ ] Stream events (Added, Modified, Deleted) to client
- [ ] Handle client disconnection gracefully using `c.Request.Context().Done()`
- [ ] Test with `curl -N` (no-buffer flag)

**Event format:**
```
data: {"type":"MODIFIED","name":"my-app-abc123","status":"Running"}

data: {"type":"DELETED","name":"my-app-abc123","status":""}
```

**Test:**
```bash
# Terminal 1 - watch the stream
curl -N http://localhost:8080/api/pods/watch

# Terminal 2 - create a pod and watch Terminal 1 update live
curl -X POST http://localhost:8080/api/pods -d '...'
```

---

### INC-015 — Namespaces API

**Type:** Backend
**Estimate:** 2 hours
**Priority:** P2

**Endpoint:** `GET /api/namespaces`

**Goal:** List all namespaces in the cluster. The UI will use this to populate a namespace dropdown.

**Tasks:**
- [ ] Implement `ListNamespaces` handler
- [ ] Return name and status of each namespace
- [ ] Filter out system namespaces optionally (`kube-system`, `kube-public`)

**Response:**
```json
{
  "namespaces": ["default", "staging", "production"]
}
```

---

### INC-016 — Error Handling & API Consistency

**Type:** Backend
**Estimate:** 3 hours
**Priority:** P1

**Goal:** Make all APIs return consistent, predictable error shapes before moving to the frontend.

**Tasks:**
- [ ] Define a standard error response struct:
```go
type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Detail  string `json:"detail,omitempty"`
}
```
- [ ] Create a helper `RespondError(c *gin.Context, status int, msg string)`
- [ ] Apply consistent error handling across all handlers
- [ ] Map K8s API errors to HTTP status codes:
  - `IsNotFound` → 404
  - `IsAlreadyExists` → 409
  - `IsInvalid` → 400
  - Everything else → 500
- [ ] Test all error paths manually

---

## API Summary

| Method | Endpoint | Description | Ticket |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | INC-007 |
| GET | `/api/namespaces` | List namespaces | INC-015 |
| GET | `/api/pods` | List pods | INC-008 |
| POST | `/api/pods` | Create pod | INC-009 |
| DELETE | `/api/pods/:name` | Delete pod | INC-010 |
| GET | `/api/deployments` | List deployments | INC-012 |
| POST | `/api/deployments` | Create deployment | INC-011 |
| DELETE | `/api/deployments/:name` | Delete deployment | INC-012 |
| POST | `/api/yaml/preview` | Generate YAML preview | INC-013 |
| GET | `/api/pods/watch` | Watch pod events (SSE) | INC-014 |

---

## Folder Structure (Phase 1)

```
incubator/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── pod.go
│   │   │   ├── deployment.go
│   │   │   └── namespace.go
│   │   ├── k8s/
│   │   │   └── client.go
│   │   ├── middleware/
│   │   │   └── cors.go
│   │   └── models/
│   │       ├── pod.go
│   │       └── deployment.go
│   ├── pkg/
│   │   └── yaml/
│   │       └── generator.go
│   ├── scripts/
│   │   └── explore/
│   │       └── main.go        ← throwaway learning scripts
│   ├── go.mod
│   └── go.sum
├── ui/                        ← Phase 2
├── deployments/               ← Phase 3
├── Makefile
├── .gitignore
└── README.md
```

---

## Definition of Done — Phase 1

Phase 1 is complete when:

- [ ] All INC-001 → INC-004 learning tasks are completed hands-on
- [ ] Go server starts and connects to Minikube successfully
- [ ] All 9 REST endpoints are working and tested via curl
- [ ] YAML preview generates valid output that `kubectl apply` accepts
- [ ] SSE watcher streams real-time pod events
- [ ] All errors return consistent JSON shapes
- [ ] Code is committed to git with meaningful commit messages

---

## Suggested Commit Structure

```
feat: init monorepo structure and go module          (INC-005)
feat: add k8s client setup with kubeconfig fallback  (INC-006)
feat: add gin server skeleton with health check      (INC-007)
feat: add list pods api                              (INC-008)
feat: add create and delete pod apis                 (INC-009, INC-010)
feat: add deployment crud apis                       (INC-011, INC-012)
feat: add yaml preview generator                     (INC-013)
feat: add sse pod watcher                            (INC-014)
feat: add namespaces api                             (INC-015)
refactor: consistent error handling across all apis  (INC-016)
```

---

## Phase 2 Preview (not in scope now)

- React UI with forms for Pod and Deployment creation
- Live YAML preview panel
- Real-time pod status dashboard using the SSE endpoint
- Namespace switcher
- PostgreSQL for saved templates and deployment history
