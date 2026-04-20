# k8s-orchestrator — API Reference

All endpoints are prefixed with `/api/v1`. Namespace is passed as a query param `?namespace=default` on all namespaced resources.

---

## Deployment

| Method | Endpoint                    | Description                     | Status            |
| ------ | --------------------------- | ------------------------------- | ----------------- |
| POST   | `/api/v1/deployments`       | Create a deployment             | done              |
| GET    | `/api/v1/deployments`       | List deployments in a namespace | planned (INC-012) |
| GET    | `/api/v1/deployments/:name` | Get a single deployment         | todo              |
| PUT    | `/api/v1/deployments/:name` | Update a deployment             | todo              |
| DELETE | `/api/v1/deployments/:name` | Delete a deployment             | planned (INC-012) |

---

## Pod

Pods are immutable — no PUT/update endpoint.

| Method | Endpoint                  | Description              | Status            |
| ------ | ------------------------- | ------------------------ | ----------------- |
| POST   | `/api/v1/pods`            | Create a pod             | planned (INC-009) |
| GET    | `/api/v1/pods`            | List pods in a namespace | planned (INC-008) |
| GET    | `/api/v1/pods/:name`      | Get a single pod         | todo              |
| GET    | `/api/v1/pods/:name/logs` | Stream container logs    | todo              |
| DELETE | `/api/v1/pods/:name`      | Delete a pod             | planned (INC-010) |

---

## Service

| Method | Endpoint                 | Description                  | Status |
| ------ | ------------------------ | ---------------------------- | ------ |
| POST   | `/api/v1/services`       | Create a service             | todo   |
| GET    | `/api/v1/services`       | List services in a namespace | todo   |
| GET    | `/api/v1/services/:name` | Get a single service         | todo   |
| PUT    | `/api/v1/services/:name` | Update a service             | todo   |
| DELETE | `/api/v1/services/:name` | Delete a service             | todo   |

---

## ConfigMap

| Method | Endpoint                   | Description                    | Status |
| ------ | -------------------------- | ------------------------------ | ------ |
| POST   | `/api/v1/configmaps`       | Create a configmap             | todo   |
| GET    | `/api/v1/configmaps`       | List configmaps in a namespace | todo   |
| GET    | `/api/v1/configmaps/:name` | Get a single configmap         | todo   |
| PUT    | `/api/v1/configmaps/:name` | Update a configmap             | todo   |
| DELETE | `/api/v1/configmaps/:name` | Delete a configmap             | todo   |

---

## Secret

| Method | Endpoint                | Description                 | Status |
| ------ | ----------------------- | --------------------------- | ------ |
| POST   | `/api/v1/secrets`       | Create a secret             | todo   |
| GET    | `/api/v1/secrets`       | List secrets in a namespace | todo   |
| GET    | `/api/v1/secrets/:name` | Get a single secret         | todo   |
| PUT    | `/api/v1/secrets/:name` | Update a secret             | todo   |
| DELETE | `/api/v1/secrets/:name` | Delete a secret             | todo   |

---

## Namespace

Namespaces are cluster-scoped — no `?namespace=` param needed.

| Method | Endpoint                   | Description         | Status            |
| ------ | -------------------------- | ------------------- | ----------------- |
| POST   | `/api/v1/namespaces`       | Create a namespace  | todo              |
| GET    | `/api/v1/namespaces`       | List all namespaces | planned (INC-015) |
| DELETE | `/api/v1/namespaces/:name` | Delete a namespace  | todo              |

---

## ServiceAccount

| Method | Endpoint                        | Description                          | Status |
| ------ | ------------------------------- | ------------------------------------ | ------ |
| POST   | `/api/v1/serviceaccounts`       | Create a service account             | todo   |
| GET    | `/api/v1/serviceaccounts`       | List service accounts in a namespace | todo   |
| GET    | `/api/v1/serviceaccounts/:name` | Get a single service account         | todo   |
| DELETE | `/api/v1/serviceaccounts/:name` | Delete a service account             | todo   |

---

## PersistentVolumeClaim (PVC)

PVCs are mostly immutable after creation — no PUT endpoint.

| Method | Endpoint             | Description              | Status |
| ------ | -------------------- | ------------------------ | ------ |
| POST   | `/api/v1/pvcs`       | Create a PVC             | todo   |
| GET    | `/api/v1/pvcs`       | List PVCs in a namespace | todo   |
| GET    | `/api/v1/pvcs/:name` | Get a single PVC         | todo   |
| DELETE | `/api/v1/pvcs/:name` | Delete a PVC             | todo   |

---

## Utility

| Method | Endpoint               | Description                         | Status            |
| ------ | ---------------------- | ----------------------------------- | ----------------- |
| GET    | `/health`              | Health check                        | done              |
| POST   | `/api/v1/yaml/preview` | Generate YAML from any request body | planned (INC-013) |
| GET    | `/api/v1/pods/watch`   | Watch pod events via SSE            | planned (INC-014) |

---

## Build Order

Suggested sequence for implementation:

1. **Pod** — simplest workload, inspect pods created by deployments
2. **Service** — pairs naturally with deployments/pods
3. **ConfigMap** + **Secret** — near-identical structure, build together
4. **Namespace** — simple, all resources live inside one
5. **ServiceAccount** — small, ties into pod security
6. **PVC** — builds on volume knowledge from deployment types

---

# 1. Parallel Fan-Out (errgroup)

Independent reads that finish as fast as the slowest one.

| Endpoint                                              | What's Parallelized                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| ⭐ `GET /api/v1/dashboard/summary`                    | List calls for Deployments / Pods / ConfigMaps / Services / Secrets / Nodes |
| `GET /api/v1/dashboard/pod-phases`                    | Per-namespace phase tallies                                                 |
| `GET /api/v1/namespace/:name/overview`                | Counts of every kind scoped to one namespace                                |
| ⭐ `GET /api/v1/deployment/:namespace/:name/overview` | Deployment + ReplicaSets + Pods + Events                                    |
| `GET /api/v1/pod/:namespace/:name/overview`           | Pod + Events + owner ref lookup + last-N log lines                          |
| `GET /api/v1/:kind/all`                               | One goroutine per namespace for cluster-wide list                           |
| `GET /api/v1/search?q=...`                            | Fan out one goroutine per kind                                              |
| `GET /api/v1/health/deep`                             | API server ping + dependencies                                              |

**Primitive:**
`errgroup.WithContext` — first error cancels the rest. No mutex needed if each goroutine writes to a distinct field.

---

# 2. Bounded Parallelism (Semaphore / Worker Pool)

Many independent writes — concurrency is needed, but capped to avoid overwhelming the API server.

| Endpoint                             | What's Parallelized                    |
| ------------------------------------ | -------------------------------------- |
| `POST /api/v1/:kind/bulk-delete`     | Delete N resources (e.g., 5 at a time) |
| `POST /api/v1/:kind/bulk-apply`      | Apply many manifests                   |
| `POST /api/v1/namespace/:name/drain` | Evict many pods with concurrency cap   |

**Primitive:**

- Buffered channel as a semaphore
- `golang.org/x/sync/semaphore`
- Collect results into a slice (each goroutine writes to its own index)

---

# 3. SSE Streams (Server-Sent Events)

One long-lived goroutine per client.
Content-Type: `text/event-stream`

In Gin:

```go
c.Stream(func(w io.Writer) bool { … })
```

| Endpoint                                                      | Goroutine Shape                                     |
| ------------------------------------------------------------- | --------------------------------------------------- |
| ⭐ `GET /api/v1/pod/:namespace/:name/logs/stream`             | `GetLogs().Stream(ctx)` → read lines → push via SSE |
| `GET /api/v1/pod/:namespace/:name/logs/stream?containers=a,b` | One goroutine per container → merge channels → SSE  |
| ⭐ `GET /api/v1/events/stream`                                | `Events().Watch(ctx)` → forward events              |
| `GET /api/v1/:kind/:namespace/watch`                          | Watch Added/Modified/Deleted events                 |
| `GET /api/v1/dashboard/live`                                  | `time.Ticker` recomputes summary periodically       |
| `GET /api/v1/pod/:namespace/:name/metrics/stream`             | Poll metrics-server → push via SSE                  |

**Primitives:**

- `context.Context` (handles client disconnect)
- Channels for producer → SSE writer
- `select` loop:

```go
select {
  case <-ctx.Done():
  case ev := <-ch:
}
```

---

# 4. WebSocket (Bidirectional)

Two goroutines per connection (read + write pumps).
More flexible than SSE.

| Endpoint                                | Goroutines                                                  |
| --------------------------------------- | ----------------------------------------------------------- |
| `GET /api/v1/pod/:ns/:name/exec`        | Read pump (browser → stdin) + write pump (stdout → browser) |
| `GET /api/v1/pod/:ns/:name/portforward` | Same two-pump pattern                                       |

---

# 5. Background / Cluster-Level Concurrency

Not per-request — long-running system-level patterns.

- **Informer Cache**
  `k8s.io/client-go/informers`
  Keeps local cache in sync via Watch → reduces API latency drastically

- **Event Hub / Pub-Sub**
  One Watch → many subscribers (avoids opening 100 watches for 100 clients)

- **Reconciler Pattern**
  Workqueue-based processing (`RateLimitingInterface`)
  Core pattern behind Kubernetes operators

---

# Recommended Learning Order

1. Dashboard summary (**errgroup**) — simplest concurrency pattern
2. Pod logs stream (**SSE**) — introduces streaming + context cancellation
3. Events watch stream (**SSE + Watch API**) — deeper Kubernetes integration
4. Informer cache — optimize once API server latency becomes an issue

---
