<div align="center">

# ⚒ Podforge

**Where your pods come to life.**

A lightweight, web-based Kubernetes resource manager — deploy and monitor containerized applications through a clean UI without writing YAML by hand.

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![client-go](https://img.shields.io/badge/client--go-0.35-326CE5?style=flat-square&logo=kubernetes)](https://github.com/kubernetes/client-go)

</div>

---

## Deploy without writing YAML

Podforge replaces `kubectl apply -f` with guided forms. Fill in the fields — image, replicas, ports, env vars — and the manifest is generated for you in a live Monaco editor on the side. Hit **Apply** and it goes straight to the cluster.

Supported resource kinds: **Pods**, **Deployments**, **Services**, **ConfigMaps**, **Secrets**.

---

## See what's happening, live

Every list view is backed by Server-Sent Events. Resources appear, update, and disappear without a page refresh. Pod status badges pulse while a pod is pending, turn green when it's running, and go red the moment it crashes.

A dedicated **Cluster Events** panel surfaces Warning and Normal events across all namespaces as they happen — the same signal as `kubectl get events -w`, but in the UI.

---

## Tail pod logs in the browser

Open any pod's detail drawer and switch to the **Logs** tab. Logs stream live via SSE with auto-scroll. The viewer supports:

- **Follow mode** — keeps scrolling as new lines arrive
- **Container selector** — switch between containers in a multi-container pod
- **Tail-N** — load the last 50 / 200 / 1000 lines, or all
- **Search & filter** — client-side highlight and hide non-matching lines
- **Download** — save the buffered log to a `.log` file

---

## Dashboard at a glance

The home dashboard shows cluster-wide resource counts and a **pod phase distribution chart** — how many pods are Running, Pending, Failed, or Succeeded right now. Drill into any namespace to get a per-namespace breakdown of every resource kind it contains.

---

## Edit any resource's YAML directly

Every resource has a **Manifest** button that opens a Monaco YAML editor pre-populated with the live resource spec. Edit in place and apply — no `kubectl edit`, no copy-pasting.

---

## Bulk operations

Select multiple resources across the list view and delete or apply them in a single request. Useful for tearing down a whole feature branch's worth of resources at once.

---

## Global search

The search bar queries across all namespaces simultaneously. Results are grouped by resource kind and link directly to the detail view. Searches match on name and labels.

---

## Roadmap

| Phase | What's next |
|-------|-------------|
| **1** | Services UI, Secrets UI, Namespace management, Deployment scale slider + restart button |
| **2** | Live SSE status badges on all list views, cluster events sidebar, connection health indicator |
| **3** | Log viewer polish — follow toggle, container selector, tail-N, search, download |
| **4** | Apply raw YAML from editor, K8s schema validation, diff view (current vs proposed) |
| **5** | Prometheus `/metrics`, ResourceQuota, LimitRange, Node list, pod/node CPU+Memory charts |
| **6+** | StatefulSets, DaemonSets, Jobs, CronJobs, PVC/PV, Ingress, RBAC browser, web terminal |

---

## Quick start

```bash
# clone & install
git clone https://github.com/Nilay1999/k8s-orchestrator.git
cd k8s-orchestrator
cp .env.example .env   # set KUBECONFIG if not ~/.kube/config
pnpm install

# run (backend :8080, UI :5173)
pnpm dev
```

---

<div align="center">

Inspired by Lens, Headlamp, and k9s · Built with Go, React, and `client-go`

</div>
