package types

type CreateNamespaceRequest struct {
	Name        string            `json:"name"        binding:"required"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
}
