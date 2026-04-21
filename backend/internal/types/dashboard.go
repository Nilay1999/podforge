package types

type DashboardSummary struct {
	Deployments int `json:"deployments"`
	Pods        int `json:"pods"`
	ConfigMaps  int `json:"configMaps"`
	Services    int `json:"services"`
	Secrets     int `json:"secrets"`
	Nodes       int `json:"nodes"`
}

type PodPhaseCounts struct {
	Running   int `json:"running"`
	Pending   int `json:"pending"`
	Failed    int `json:"failed"`
	Succeeded int `json:"succeeded"`
	Unknown   int `json:"unknown"`
}

type NamespaceOverview struct {
	Namespace   string `json:"namespace"`
	Deployments int    `json:"deployments"`
	Pods        int    `json:"pods"`
	ConfigMaps  int    `json:"configMaps"`
	Services    int    `json:"services"`
	Secrets     int    `json:"secrets"`
}
