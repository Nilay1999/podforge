# k8s-orchestrator — API Reference

All endpoints are prefixed with `/api/v1`. Namespace is passed as a query param `?namespace=default` on all namespaced resources.

---

## Deployment

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/deployments` | Create a deployment | done |
| GET | `/api/v1/deployments` | List deployments in a namespace | planned (INC-012) |
| GET | `/api/v1/deployments/:name` | Get a single deployment | todo |
| PUT | `/api/v1/deployments/:name` | Update a deployment | todo |
| DELETE | `/api/v1/deployments/:name` | Delete a deployment | planned (INC-012) |

---

## Pod

Pods are immutable — no PUT/update endpoint.

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/pods` | Create a pod | planned (INC-009) |
| GET | `/api/v1/pods` | List pods in a namespace | planned (INC-008) |
| GET | `/api/v1/pods/:name` | Get a single pod | todo |
| GET | `/api/v1/pods/:name/logs` | Stream container logs | todo |
| DELETE | `/api/v1/pods/:name` | Delete a pod | planned (INC-010) |

---

## Service

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/services` | Create a service | todo |
| GET | `/api/v1/services` | List services in a namespace | todo |
| GET | `/api/v1/services/:name` | Get a single service | todo |
| PUT | `/api/v1/services/:name` | Update a service | todo |
| DELETE | `/api/v1/services/:name` | Delete a service | todo |

---

## ConfigMap

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/configmaps` | Create a configmap | todo |
| GET | `/api/v1/configmaps` | List configmaps in a namespace | todo |
| GET | `/api/v1/configmaps/:name` | Get a single configmap | todo |
| PUT | `/api/v1/configmaps/:name` | Update a configmap | todo |
| DELETE | `/api/v1/configmaps/:name` | Delete a configmap | todo |

---

## Secret

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/secrets` | Create a secret | todo |
| GET | `/api/v1/secrets` | List secrets in a namespace | todo |
| GET | `/api/v1/secrets/:name` | Get a single secret | todo |
| PUT | `/api/v1/secrets/:name` | Update a secret | todo |
| DELETE | `/api/v1/secrets/:name` | Delete a secret | todo |

---

## Namespace

Namespaces are cluster-scoped — no `?namespace=` param needed.

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/namespaces` | Create a namespace | todo |
| GET | `/api/v1/namespaces` | List all namespaces | planned (INC-015) |
| DELETE | `/api/v1/namespaces/:name` | Delete a namespace | todo |

---

## ServiceAccount

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/serviceaccounts` | Create a service account | todo |
| GET | `/api/v1/serviceaccounts` | List service accounts in a namespace | todo |
| GET | `/api/v1/serviceaccounts/:name` | Get a single service account | todo |
| DELETE | `/api/v1/serviceaccounts/:name` | Delete a service account | todo |

---

## PersistentVolumeClaim (PVC)

PVCs are mostly immutable after creation — no PUT endpoint.

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/pvcs` | Create a PVC | todo |
| GET | `/api/v1/pvcs` | List PVCs in a namespace | todo |
| GET | `/api/v1/pvcs/:name` | Get a single PVC | todo |
| DELETE | `/api/v1/pvcs/:name` | Delete a PVC | todo |

---

## Utility

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | done |
| POST | `/api/v1/yaml/preview` | Generate YAML from any request body | planned (INC-013) |
| GET | `/api/v1/pods/watch` | Watch pod events via SSE | planned (INC-014) |

---

## Build Order

Suggested sequence for implementation:

1. **Pod** — simplest workload, inspect pods created by deployments
2. **Service** — pairs naturally with deployments/pods
3. **ConfigMap** + **Secret** — near-identical structure, build together
4. **Namespace** — simple, all resources live inside one
5. **ServiceAccount** — small, ties into pod security
6. **PVC** — builds on volume knowledge from deployment types
