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

type ValidationError struct{ Err error }

func (e *ValidationError) Error() string { return e.Err.Error() }
func (e *ValidationError) Unwrap() error { return e.Err }

// SidecarContainer is used for both initContainers and additional sidecar containers.
type SidecarContainer struct {
	Name            string                    `json:"name"  binding:"required"`
	Image           string                    `json:"image" binding:"required"`
	Command         []string                  `json:"command,omitempty"`
	Args            []string                  `json:"args,omitempty"`
	WorkingDir      string                    `json:"workingDir,omitempty"`
	Ports           []ContainerPort           `json:"ports,omitempty"`
	EnvVars         map[string]string         `json:"envVars,omitempty"`
	EnvFrom         []EnvFrom                 `json:"envFrom,omitempty"`
	ImagePullPolicy string                    `json:"imagePullPolicy,omitempty"`
	Resources       *ResourceRequirements     `json:"resources,omitempty"`
	VolumeMounts    []VolumeMount             `json:"volumeMounts,omitempty"`
	LivenessProbe   *Probe                    `json:"livenessProbe,omitempty"`
	ReadinessProbe  *Probe                    `json:"readinessProbe,omitempty"`
	StartupProbe    *Probe                    `json:"startupProbe,omitempty"`
	Lifecycle       *Lifecycle                `json:"lifecycle,omitempty"`
	SecurityContext *ContainerSecurityContext `json:"securityContext,omitempty"`
}

type ContainerPort struct {
	Name          string `json:"name,omitempty"`
	ContainerPort int32  `json:"containerPort"`
	Protocol      string `json:"protocol,omitempty"` // TCP (default) | UDP | SCTP
	HostPort      int32  `json:"hostPort,omitempty"`
}

type EnvFrom struct {
	ConfigMapRef string `json:"configMapRef,omitempty"`
	SecretRef    string `json:"secretRef,omitempty"`
	Prefix       string `json:"prefix,omitempty"`
}

type ResourceRequirements struct {
	Requests *ResourceList `json:"requests,omitempty"`
	Limits   *ResourceList `json:"limits,omitempty"`
}

type ResourceList struct {
	CPU              string `json:"cpu,omitempty"`
	Memory           string `json:"memory,omitempty"`
	EphemeralStorage string `json:"ephemeralStorage,omitempty"`
}

// Probe supports httpGet, exec, and tcpSocket handlers.
// Exactly one of HTTPGet, Exec, or TCPSocket must be set.
type Probe struct {
	HTTPGet   *HTTPGetAction   `json:"httpGet,omitempty"`
	Exec      *ExecAction      `json:"exec,omitempty"`
	TCPSocket *TCPSocketAction `json:"tcpSocket,omitempty"`

	InitialDelaySeconds int32 `json:"initialDelaySeconds,omitempty"`
	PeriodSeconds       int32 `json:"periodSeconds,omitempty"`
	TimeoutSeconds      int32 `json:"timeoutSeconds,omitempty"`
	SuccessThreshold    int32 `json:"successThreshold,omitempty"`
	FailureThreshold    int32 `json:"failureThreshold,omitempty"`
}

type HTTPGetAction struct {
	Path        string            `json:"path"`
	Port        int32             `json:"port"`
	HTTPHeaders map[string]string `json:"httpHeaders,omitempty"`
}

type ExecAction struct {
	Command []string `json:"command"`
}

type TCPSocketAction struct {
	Port int32 `json:"port"`
}

type Lifecycle struct {
	PostStart *LifecycleHandler `json:"postStart,omitempty"`
	PreStop   *LifecycleHandler `json:"preStop,omitempty"`
}

type LifecycleHandler struct {
	Exec    *ExecAction    `json:"exec,omitempty"`
	HTTPGet *HTTPGetAction `json:"httpGet,omitempty"`
}

type VolumeMount struct {
	Name      string `json:"name"`
	MountPath string `json:"mountPath"`
	SubPath   string `json:"subPath,omitempty"`
	ReadOnly  bool   `json:"readOnly,omitempty"`
}

type Volume struct {
	Name                  string                 `json:"name"`
	ConfigMap             *ConfigMapVolumeSource `json:"configMap,omitempty"`
	Secret                *SecretVolumeSource    `json:"secret,omitempty"`
	EmptyDir              *EmptyDirVolumeSource  `json:"emptyDir,omitempty"`
	PersistentVolumeClaim *PVCVolumeSource       `json:"persistentVolumeClaim,omitempty"`
	HostPath              *HostPathVolumeSource  `json:"hostPath,omitempty"`
}

type ConfigMapVolumeSource struct {
	Name        string      `json:"name"`
	DefaultMode *int32      `json:"defaultMode,omitempty"`
	Items       []KeyToPath `json:"items,omitempty"`
	Optional    *bool       `json:"optional,omitempty"`
}

type SecretVolumeSource struct {
	SecretName  string      `json:"secretName"`
	DefaultMode *int32      `json:"defaultMode,omitempty"`
	Items       []KeyToPath `json:"items,omitempty"`
	Optional    *bool       `json:"optional,omitempty"`
}

type EmptyDirVolumeSource struct {
	Medium    string `json:"medium,omitempty"`    // "" | Memory | HugePages
	SizeLimit string `json:"sizeLimit,omitempty"` // resource quantity, e.g. "1Gi"
}

type PVCVolumeSource struct {
	ClaimName string `json:"claimName"`
	ReadOnly  bool   `json:"readOnly,omitempty"`
}

type HostPathVolumeSource struct {
	Path string `json:"path"`
	Type string `json:"type,omitempty"` // Directory | File | Socket | CharDevice | BlockDevice
}

type KeyToPath struct {
	Key  string `json:"key"`
	Path string `json:"path"`
	Mode *int32 `json:"mode,omitempty"`
}

type PodSecurityContext struct {
	RunAsUser    *int64 `json:"runAsUser,omitempty"`
	RunAsGroup   *int64 `json:"runAsGroup,omitempty"`
	RunAsNonRoot *bool  `json:"runAsNonRoot,omitempty"`
	FSGroup      *int64 `json:"fsGroup,omitempty"`
}

type ContainerSecurityContext struct {
	RunAsUser                *int64        `json:"runAsUser,omitempty"`
	RunAsGroup               *int64        `json:"runAsGroup,omitempty"`
	RunAsNonRoot             *bool         `json:"runAsNonRoot,omitempty"`
	ReadOnlyRootFilesystem   *bool         `json:"readOnlyRootFilesystem,omitempty"`
	AllowPrivilegeEscalation *bool         `json:"allowPrivilegeEscalation,omitempty"`
	Privileged               *bool         `json:"privileged,omitempty"`
	Capabilities             *Capabilities `json:"capabilities,omitempty"`
}

type Capabilities struct {
	Add  []string `json:"add,omitempty"`
	Drop []string `json:"drop,omitempty"`
}

type Toleration struct {
	Key               string `json:"key,omitempty"`
	Operator          string `json:"operator,omitempty"` // Equal | Exists
	Value             string `json:"value,omitempty"`
	Effect            string `json:"effect,omitempty"` // NoSchedule | PreferNoSchedule | NoExecute
	TolerationSeconds *int64 `json:"tolerationSeconds,omitempty"`
}

type Affinity struct {
	NodeAffinity    *NodeAffinity    `json:"nodeAffinity,omitempty"`
	PodAffinity     *PodAffinity     `json:"podAffinity,omitempty"`
	PodAntiAffinity *PodAntiAffinity `json:"podAntiAffinity,omitempty"`
}

type NodeAffinity struct {
	// RequiredMatchExpressions maps to requiredDuringSchedulingIgnoredDuringExecution.
	// All expressions are combined under a single NodeSelectorTerm.
	RequiredMatchExpressions []NodeSelectorRequirement `json:"requiredMatchExpressions,omitempty"`
	// PreferredMatchExpressions maps to preferredDuringSchedulingIgnoredDuringExecution.
	PreferredMatchExpressions []PreferredNodeExpression `json:"preferredMatchExpressions,omitempty"`
}

type NodeSelectorRequirement struct {
	Key      string   `json:"key"`
	Operator string   `json:"operator"` // In | NotIn | Exists | DoesNotExist | Gt | Lt
	Values   []string `json:"values,omitempty"`
}

type PreferredNodeExpression struct {
	Weight           int32                     `json:"weight"`
	MatchExpressions []NodeSelectorRequirement `json:"matchExpressions"`
}

type PodAffinity struct {
	Required  []PodAffinityTerm         `json:"required,omitempty"`
	Preferred []WeightedPodAffinityTerm `json:"preferred,omitempty"`
}

type PodAntiAffinity struct {
	Required  []PodAffinityTerm         `json:"required,omitempty"`
	Preferred []WeightedPodAffinityTerm `json:"preferred,omitempty"`
}

type PodAffinityTerm struct {
	TopologyKey      string                     `json:"topologyKey"`
	MatchLabels      map[string]string          `json:"matchLabels,omitempty"`
	MatchExpressions []LabelSelectorRequirement `json:"matchExpressions,omitempty"`
	Namespaces       []string                   `json:"namespaces,omitempty"`
}

type WeightedPodAffinityTerm struct {
	Weight          int32           `json:"weight"`
	PodAffinityTerm PodAffinityTerm `json:"podAffinityTerm"`
}

type LabelSelectorRequirement struct {
	Key      string   `json:"key"`
	Operator string   `json:"operator"` // In | NotIn | Exists | DoesNotExist
	Values   []string `json:"values,omitempty"`
}

type TopologySpreadConstraint struct {
	MaxSkew           int32             `json:"maxSkew"`
	TopologyKey       string            `json:"topologyKey"`
	WhenUnsatisfiable string            `json:"whenUnsatisfiable"` // DoNotSchedule | ScheduleAnyway
	MatchLabels       map[string]string `json:"matchLabels,omitempty"`
}

// DeploymentStrategy controls rollout behaviour.
// Type: "RollingUpdate" (default) or "Recreate".
// MaxSurge / MaxUnavailable accept integers ("1") or percentages ("25%").
type DeploymentStrategy struct {
	Type           string `json:"type,omitempty"`
	MaxSurge       string `json:"maxSurge,omitempty"`
	MaxUnavailable string `json:"maxUnavailable,omitempty"`
}
