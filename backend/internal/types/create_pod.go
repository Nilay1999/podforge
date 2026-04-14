package types

type CreatePodRequest struct {
	// Core
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace" binding:"required"`

	// Metadata
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`

	// Containers (reuses SidecarContainer from create_deployment.go)
	Containers     []SidecarContainer `json:"containers"               binding:"required,min=1"`
	InitContainers []SidecarContainer `json:"initContainers,omitempty"`

	// Volumes
	Volumes []Volume `json:"volumes,omitempty"`

	// Pod identity & permissions
	ServiceAccount               string   `json:"serviceAccount,omitempty"`
	AutomountServiceAccountToken *bool    `json:"automountServiceAccountToken,omitempty"`
	ImagePullSecrets             []string `json:"imagePullSecrets,omitempty"`

	// Scheduling
	NodeName                  string                     `json:"nodeName,omitempty"`
	NodeSelector              map[string]string          `json:"nodeSelector,omitempty"`
	Affinity                  *Affinity                  `json:"affinity,omitempty"`
	Tolerations               []Toleration               `json:"tolerations,omitempty"`
	TopologySpreadConstraints []TopologySpreadConstraint `json:"topologySpreadConstraints,omitempty"`
	PriorityClassName         string                     `json:"priorityClassName,omitempty"`
	Priority                  *int32                     `json:"priority,omitempty"`
	PreemptionPolicy          string                     `json:"preemptionPolicy,omitempty"` // PreemptLowerPriority | Never
	RuntimeClassName          string                     `json:"runtimeClassName,omitempty"`
	SchedulerName             string                     `json:"schedulerName,omitempty"`

	// Security
	SecurityContext *PodSecurityContext `json:"securityContext,omitempty"`

	// DNS
	DNSPolicy string     `json:"dnsPolicy,omitempty"` // ClusterFirst | ClusterFirstWithHostNet | Default | None
	DNSConfig *DNSConfig `json:"dnsConfig,omitempty"`

	// Host settings
	HostNetwork bool        `json:"hostNetwork,omitempty"`
	HostPID     bool        `json:"hostPID,omitempty"`
	HostIPC     bool        `json:"hostIPC,omitempty"`
	Hostname    string      `json:"hostname,omitempty"`
	Subdomain   string      `json:"subdomain,omitempty"`
	HostAliases []HostAlias `json:"hostAliases,omitempty"`

	// Lifecycle
	RestartPolicy                 string `json:"restartPolicy,omitempty"` // Always (default) | OnFailure | Never
	TerminationGracePeriodSeconds *int64 `json:"terminationGracePeriodSeconds,omitempty"`
	ActiveDeadlineSeconds         *int64 `json:"activeDeadlineSeconds,omitempty"`

	// Readiness gates
	ReadinessGates []PodReadinessGate `json:"readinessGates,omitempty"`

	// Overhead & misc
	Overhead           *ResourceList `json:"overhead,omitempty"`
	EnableServiceLinks *bool         `json:"enableServiceLinks,omitempty"`
}

type CreatePodResponse struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
}

type DNSConfig struct {
	Nameservers []string          `json:"nameservers,omitempty"`
	Searches    []string          `json:"searches,omitempty"`
	Options     []DNSConfigOption `json:"options,omitempty"`
}

type DNSConfigOption struct {
	Name  string `json:"name"`
	Value string `json:"value,omitempty"`
}

type HostAlias struct {
	IP        string   `json:"ip"`
	Hostnames []string `json:"hostnames"`
}

type PodReadinessGate struct {
	ConditionType string `json:"conditionType"`
}
