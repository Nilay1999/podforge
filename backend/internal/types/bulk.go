package types

type BulkTarget struct {
	Namespace string `json:"namespace" binding:"required"`
	Name      string `json:"name"      binding:"required"`
}

// Kind: pod | deployment | configmap | service | secret
type BulkDeleteRequest struct {
	Kind    string       `json:"kind"    binding:"required"`
	Targets []BulkTarget `json:"targets" binding:"required,min=1"`
}

type BulkApplyRequest struct {
	Manifests []string `json:"manifests" binding:"required,min=1"`
}

type BulkItemResult struct {
	Target BulkTarget `json:"target"`
	Error  string     `json:"error,omitempty"`
}

type BulkDeleteResult struct {
	Succeeded []BulkTarget     `json:"succeeded"`
	Failed    []BulkItemResult `json:"failed"`
}

type BulkApplyResult struct {
	Succeeded []BulkTarget     `json:"succeeded"`
	Failed    []BulkItemResult `json:"failed"`
}
