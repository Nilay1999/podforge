# Frontend Architecture & Concepts

Incubator's frontend is a React + TypeScript SPA that communicates with a Go backend over REST and SSE. This document explains how every major piece works and why it was built that way.

---

## Stack

| Layer | Library | Version | Role |
|---|---|---|---|
| Framework | React | 19 | Component model and rendering |
| Language | TypeScript | 5 | Static types across the whole codebase |
| Build | Vite | 6 | Dev server, HMR, production bundling |
| UI | Mantine | 7 | Components, theming, hooks (`useDisclosure`, `useForm`) |
| Server state | TanStack Query | 5 | Fetching, caching, invalidation |
| HTTP | Axios | — | API client with response interceptor |
| YAML | js-yaml | — | Serialize/deserialize between form payloads and YAML strings |
| Editor | @uiw/react-codemirror | — | Embedded Monaco-like editor for raw YAML editing |

---

## Directory Map

```
ui/src/
├── api/              Axios wrappers — one file per resource kind
├── hooks/            TanStack Query hooks — one file per resource kind + factory
├── pages/            Route-level components — one file per page
├── components/
│   ├── common/       ResourceListPage (generic list page) + AppLayout
│   ├── forms/        Form components per kind (Pod, Deployment, ConfigMap)
│   ├── manifest/     ManifestDrawer, ManifestEditor, kindStrategies
│   └── pods/         PodDetailDrawer (pod-specific detail panel)
├── types/            TypeScript types mirroring backend response shapes
└── utils/            Constants (namespaces) and helper functions
```

---

## Data Fetching

### Axios client (`api/client.ts`)

A single Axios instance prefixed at `/api/v1/`. A response interceptor normalises error shapes so every thrown error has `error.message` pulled from the backend's `{ code, message, detail }` envelope.

```ts
apiClient.interceptors.response.use(
  (r) => r,
  (error) => Promise.reject(new Error(error.response?.data?.message ?? error.message)),
);
```

All API modules are thin one-liners on top of this client:

```ts
// api/deployments.ts
export const listDeployments = (namespace: string) =>
  apiClient.get<DeploymentList>(`/deployment/${namespace}`).then((r) => r.data);
```

### `createResourceHooks` factory (`hooks/createResourceHooks.ts`)

Rather than writing the same TanStack Query boilerplate for every resource kind, the factory generates a set of hooks from a resource name and a plain API object:

```ts
const hooks = createResourceHooks<Deployment, DeploymentList, CreateDeploymentRequest>(
  "deployments",
  { list, get, create, remove },
);
```

It produces:

| Hook | What it does |
|---|---|
| `useList(namespace)` | Fetches all items; re-polls every 15 s |
| `useDetail(namespace, name)` | Fetches a single item; disabled until both params are non-empty |
| `useCreate()` | Mutation that calls `create`; invalidates the whole resource cache on success |
| `useRemove(namespace)` | Mutation that calls `remove`; invalidates the whole resource cache on success |

#### Query key structure

```ts
keys.all          = ["deployments"]                           // invalidates everything
keys.list(ns)     = ["deployments", "list", "default"]       // one namespace
keys.detail(ns, n)= ["deployments", "detail", "default", "nginx"] // one item
```

`invalidateQueries({ queryKey: keys.all })` is used after mutations — it refetches both the list and any cached detail queries.

### Per-resource hook files

Each file (`useDeployments.ts`, `usePods.ts`, `useConfigMaps.ts`) calls the factory and re-exports the hooks under readable names:

```ts
export const useDeployments    = hooks.useList;
export const useDeployment     = hooks.useDetail;
export const useCreateDeployment = hooks.useCreate;
export const useDeleteDeployment = hooks.useRemove;
```

---

## Generic List Page (`components/common/ResourceListPage.tsx`)

`ResourceListPage<T>` is a generic component that handles the entire list-page layout for any resource kind. Pages only provide:

- `columns` — an array of `{ header, render }` descriptors
- `useList` / `useDelete` — the generated hooks for that kind
- Optional `onRowClick` / `onEditItem` callbacks

Internals it handles itself:
- Namespace selector (persisted in local state)
- Name filter (client-side, on the fetched list)
- Create button → opens `ManifestDrawer` in create mode
- Per-row action menu with "Edit manifest" and "Delete"
- Loading / error states
- Empty state message

Column render functions receive a typed item and return a `ReactNode`, keeping column definitions co-located with the page:

```ts
const columns: Column<Deployment>[] = [
  {
    header: "Ready",
    render: (d) => {
      const ready = d.status?.readyReplicas ?? 0;
      const total = d.spec?.replicas ?? 0;
      return <Text ff="monospace">{total > 0 ? `${ready}/${total}` : "–"}</Text>;
    },
  },
];
```

---

## Manifest Workflow

### `kindStrategies.ts` — the bidirectional bridge

Every resource kind has a `KindStrategy`:

```ts
interface KindStrategy {
  initialPayload: AnyPayload;       // blank form values for the create case
  toManifest(payload): object;      // form payload → full K8s object (for YAML preview)
  fromManifest(raw): AnyPayload;    // raw parsed YAML → form payload (for edit / YAML→form sync)
}
```

The `KIND_STRATEGIES` map is the single lookup for all three directions:

```ts
KIND_STRATEGIES["Deployment"].toManifest(payload)   // form values → K8s YAML object
KIND_STRATEGIES["Deployment"].fromManifest(yamlObj)  // YAML object → form values
KIND_STRATEGIES["Deployment"].initialPayload          // empty form default
```

`toManifest` builds a complete `apps/v1 Deployment` object from a flat `CreateDeploymentRequest`. `fromManifest` does the reverse, pulling values back out of the nested K8s spec.

### `ManifestDrawer` — create and edit in one component

The drawer has two tabs: **Form** and **YAML**. They stay in sync:

- Switching **Form → YAML**: calls `strategy.toManifest(currentPayload)` and serializes with `js-yaml`
- Switching **YAML → Form**: parses the editor content with `js-yaml`, calls `strategy.fromManifest`, and re-mounts the form with the new `defaultPayload` (via a `formKey` increment)

**Create vs Edit mode** is determined by whether the `onApply` prop is provided:

```ts
const isEditMode = Boolean(onApply);
const apply = onApply ?? handleCreate;
```

In create mode, `handleCreate` dispatches to the right `useCreateXxx` mutation via a lookup map:

```ts
const creators = { ConfigMap: createConfigMap, Deployment: createDeployment, Pod: createPod };
creators[kind].mutate(payload, opts);
```

In edit mode, the page's `handleEditApply` (from `useEditManifestDrawer`) calls the API directly and invalidates the cache.

**Apply button flow**: the button is `type="button"`. When clicked:
1. If on the YAML tab → parse YAML → call `applyPayload`
2. If on the Form tab → call `formEl.requestSubmit()` to trigger native form validation and the form's `onSubmit`

The form's `onSubmit` then calls back into `applyPayload`, which fires the mutation and shows a notification.

### Form components

Each form (`DeploymentManifestForm`, `PodManifestForm`, `ConfigMapManifestForm`) uses Mantine's `useForm` in **uncontrolled mode**:

```ts
const form = useForm<CreateDeploymentRequest>({ mode: "uncontrolled", initialValues: ... });
```

Uncontrolled mode means form field values are stored inside the form instance — not in React state — so typing does not cause re-renders of the whole form tree. Values are read via `form.getValues()` only at submit time.

`KeyValuePairsField` manages dynamic label/annotation/data pairs outside the Mantine form because they're arrays of objects that grow and shrink. It uses local `useState` and exposes a `registerGetter` callback that lets the parent form read the current pairs at submit time without lifting state.

`ManifestForm` is a thin dispatcher that renders the right form component based on `kind`:

```ts
const FORM_MAP = { Deployment: DeploymentManifestForm, Pod: PodManifestForm, ConfigMap: ConfigMapManifestForm };
const Form = FORM_MAP[kind];
```

---

## Edit Flow (`useEditManifestDrawer`)

All three list pages (Pods, Deployments, ConfigMaps) follow the exact same edit pattern, extracted into a single hook:

```ts
const { editDrawerOpened, closeEditDrawer, handleEditItem, handleEditApply, editInitialPayload } =
  useEditManifestDrawer<Deployment>("Deployment", updateDeployment, "deployments");
```

Internally the hook:
1. Holds `editingItem` in state and a `useDisclosure` for the drawer
2. `handleEditItem(item)` — sets `editingItem` and opens the drawer
3. `editInitialPayload` — computed from `KIND_STRATEGIES[kind].fromManifest(editingItem)` on each render
4. `handleEditApply(payload, opts)` — calls the passed `updateFn(namespace, name, payload)`, invalidates `[queryKey]`, and calls `opts.onSuccess` or `opts.onError`

Pages destructure these five values and wire them directly to `ManifestDrawer` and `ResourceListPage`. No page needs to own a `useQueryClient`, a `useDisclosure`, or any update state of its own.

---

## Real-Time Streaming (SSE)

Two places use the browser's `EventSource` API to receive server-sent events from the backend:

### Cluster events (Dashboard)

```ts
useEffect(() => {
  const es = new EventSource("/api/v1/events/stream");
  const handler = (e: MessageEvent) => {
    const event = JSON.parse(e.data) as ClusterEvent;
    setClusterEvents((prev) => [event, ...prev].slice(0, 20));
  };
  es.onmessage = handler;
  ["warning", "normal", "Warning", "Normal"].forEach((type) => es.addEventListener(type, handler));
  es.onerror = () => es.close();
  return () => es.close();
}, []);
```

The backend sends named events (`event: Warning\ndata: {...}`) so both `onmessage` and named listeners are registered to handle variations.

### Pod log streaming (PodDetailDrawer)

```ts
useEffect(() => {
  if (!pod || tab !== "logs") return;
  const es = new EventSource(`/api/v1/pod/${ns}/${name}/logs/stream`);
  es.onmessage = (e) => setLogLines((prev) => [...prev.slice(-499), e.data]);
  es.onerror = () => es.close();
  return () => es.close();
}, [tab, pod?.metadata.namespace, pod?.metadata.name]);
```

The stream only opens when the Logs tab is active. It caps at 500 lines in memory (`slice(-499)`). The cleanup function closes the connection when the tab changes or the drawer closes.

---

## Theming and Styling

The Mantine theme is configured in `theme.ts` and passed to `MantineProvider` in `main.tsx`. Custom semantic color names (`success`, `warning`, `danger`, `steelBlue`) are registered there so components can reference them by name (`color="success"`) without hardcoding hex values.

The CodeMirror editor has two custom themes in `components/manifest/editorTheme.ts`:
- `appEditorThemeDark` — used in dark color scheme
- `appEditorThemeLight` — used in light color scheme

`ManifestEditor` reads the active scheme via `useMantineColorScheme` and passes the right theme to CodeMirror:

```ts
const { colorScheme } = useMantineColorScheme();
const editorTheme = colorScheme === "dark" ? appEditorThemeDark : appEditorThemeLight;
```

---

## End-to-End Flow: Create a Deployment

1. User clicks "Create Deployment" on the Deployments page
2. `ResourceListPage` calls `openDrawer()` → `ManifestDrawer` mounts with `kind="Deployment"` and no `onApply` (create mode)
3. `useEffect` on `opened` seeds the form with `KIND_STRATEGIES["Deployment"].initialPayload` and serializes it to YAML for the editor
4. User fills the Form tab; `DeploymentManifestForm` collects values via `useForm` (uncontrolled)
5. User clicks "Apply" → `handleApplyClick` calls `formEl.requestSubmit()`
6. Form's `onSubmit` runs validation; on success, calls `applyPayload(buildPayload())`
7. `applyPayload` calls `handleCreate` → `createDeployment.mutate(payload, opts)`
8. On success: cache for `["deployments"]` is invalidated → `useDeployments` re-fetches → table updates; notification shown; drawer closes

## End-to-End Flow: Edit a Deployment

1. User opens the row menu → "Edit manifest"
2. `ResourceListPage` calls `onEditItem(item)` → `handleEditItem` from `useEditManifestDrawer`
3. Hook sets `editingItem` and opens the drawer; `editInitialPayload` is computed via `fromManifest`
4. `ManifestDrawer` receives `initialPayload` and `onApply` → enters edit mode
5. `useEffect` on `opened` seeds the form with `editInitialPayload`
6. User edits and clicks "Save changes" → same form submit path as create
7. `applyPayload` calls `onApply` (the hook's `handleEditApply`) → `updateDeployment(namespace, name, payload)`
8. On success: `["deployments"]` invalidated → table updates; notification shown; drawer closes
