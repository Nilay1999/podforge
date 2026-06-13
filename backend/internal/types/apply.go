package types

type ApplyRequest struct {
	YAML      string `json:"yaml"      binding:"required"`
	Namespace string `json:"namespace"`
	DryRun    bool   `json:"dryRun"`
}

type AppliedResource struct {
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
}

type ApplyResult struct {
	DryRun  bool              `json:"dryRun"`
	Applied []AppliedResource `json:"applied"`
}
