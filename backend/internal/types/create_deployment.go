package types

type CreateDeploymentRequest struct {
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace" binding:"required"`
	Image     string `json:"image"     binding:"required"`
	Replicas  int32  `json:"replicas"  binding:"required,min=1,max=100"`

	// Metadata
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`

	// Container
	Command []string          `json:"command,omitempty"`
	Args    []string          `json:"args,omitempty"`
	Ports   []int32           `json:"ports,omitempty"`
	EnvVars map[string]string `json:"envVars,omitempty"`
	EnvFrom []EnvFrom         `json:"envFrom,omitempty"`

	// Resources
	Resources *ResourceRequirements `json:"resources,omitempty"`

	// Probes
	LivenessProbe  *Probe `json:"livenessProbe,omitempty"`
	ReadinessProbe *Probe `json:"readinessProbe,omitempty"`

	// Pod
	ImagePullSecrets []string `json:"imagePullSecrets,omitempty"`
	ServiceAccount   string   `json:"serviceAccount,omitempty"`

	// Rollout
	Strategy *DeploymentStrategy `json:"strategy,omitempty"`
}

// ResourceRequirements maps to k8s resource requests and limits.
type ResourceRequirements struct {
	Requests *ResourceList `json:"requests,omitempty"`
	Limits   *ResourceList `json:"limits,omitempty"`
}

type ResourceList struct {
	CPU    string `json:"cpu,omitempty"`
	Memory string `json:"memory,omitempty"`
}

// Probe covers httpGet liveness and readiness checks.
type Probe struct {
	Path                string `json:"path"`
	Port                int32  `json:"port"`
	InitialDelaySeconds int32  `json:"initialDelaySeconds,omitempty"`
	PeriodSeconds       int32  `json:"periodSeconds,omitempty"`
	FailureThreshold    int32  `json:"failureThreshold,omitempty"`
}

// EnvFrom sources env vars from a ConfigMap or Secret.
type EnvFrom struct {
	ConfigMapRef string `json:"configMapRef,omitempty"`
	SecretRef    string `json:"secretRef,omitempty"`
}

// DeploymentStrategy controls rollout behaviour.
// Type: "RollingUpdate" (default) or "Recreate".
type DeploymentStrategy struct {
	Type           string `json:"type,omitempty"`
	MaxSurge       *int32 `json:"maxSurge,omitempty"`
	MaxUnavailable *int32 `json:"maxUnavailable,omitempty"`
}

type CreateDeploymentResponse struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
}
