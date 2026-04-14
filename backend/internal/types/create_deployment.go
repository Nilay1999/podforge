package types

type CreateDeploymentRequest struct {
	// Core
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace" binding:"required"`
	Image     string `json:"image"     binding:"required"`
	Replicas  int32  `json:"replicas"  binding:"required,min=1,max=100"`

	// Metadata
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`

	// Primary container
	Command                  []string                  `json:"command,omitempty"`
	Args                     []string                  `json:"args,omitempty"`
	WorkingDir               string                    `json:"workingDir,omitempty"`
	Ports                    []ContainerPort           `json:"ports,omitempty"`
	EnvVars                  map[string]string         `json:"envVars,omitempty"`
	EnvFrom                  []EnvFrom                 `json:"envFrom,omitempty"`
	ImagePullPolicy          string                    `json:"imagePullPolicy,omitempty"` // Always | IfNotPresent | Never
	Resources                *ResourceRequirements     `json:"resources,omitempty"`
	VolumeMounts             []VolumeMount             `json:"volumeMounts,omitempty"`
	LivenessProbe            *Probe                    `json:"livenessProbe,omitempty"`
	ReadinessProbe           *Probe                    `json:"readinessProbe,omitempty"`
	StartupProbe             *Probe                    `json:"startupProbe,omitempty"`
	Lifecycle                *Lifecycle                `json:"lifecycle,omitempty"`
	ContainerSecurityContext *ContainerSecurityContext `json:"containerSecurityContext,omitempty"`

	// Additional containers
	Sidecars       []SidecarContainer `json:"sidecars,omitempty"`
	InitContainers []SidecarContainer `json:"initContainers,omitempty"`

	// Pod
	Volumes                       []Volume                   `json:"volumes,omitempty"`
	ImagePullSecrets              []string                   `json:"imagePullSecrets,omitempty"`
	ServiceAccount                string                     `json:"serviceAccount,omitempty"`
	NodeSelector                  map[string]string          `json:"nodeSelector,omitempty"`
	NodeName                      string                     `json:"nodeName,omitempty"`
	Tolerations                   []Toleration               `json:"tolerations,omitempty"`
	Affinity                      *Affinity                  `json:"affinity,omitempty"`
	TopologySpreadConstraints     []TopologySpreadConstraint `json:"topologySpreadConstraints,omitempty"`
	PodSecurityContext            *PodSecurityContext        `json:"podSecurityContext,omitempty"`
	TerminationGracePeriodSeconds *int64                     `json:"terminationGracePeriodSeconds,omitempty"`
	PriorityClassName             string                     `json:"priorityClassName,omitempty"`
	RuntimeClassName              string                     `json:"runtimeClassName,omitempty"`
	DNSPolicy                     string                     `json:"dnsPolicy,omitempty"` // ClusterFirst | ClusterFirstWithHostNet | Default | None

	// Rollout
	Strategy                *DeploymentStrategy `json:"strategy,omitempty"`
	MinReadySeconds         int32               `json:"minReadySeconds,omitempty"`
	RevisionHistoryLimit    *int32              `json:"revisionHistoryLimit,omitempty"`
	ProgressDeadlineSeconds *int32              `json:"progressDeadlineSeconds,omitempty"`
}

// DeploymentStrategy controls rollout behaviour.
// Type: "RollingUpdate" (default) or "Recreate".
// MaxSurge / MaxUnavailable accept integers ("1") or percentages ("25%").
type DeploymentStrategy struct {
	Type           string `json:"type,omitempty"`
	MaxSurge       string `json:"maxSurge,omitempty"`
	MaxUnavailable string `json:"maxUnavailable,omitempty"`
}
