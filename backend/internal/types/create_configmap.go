package types

type CreateConfigmapRequest struct {
	// Core
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace"` // Can be optional with default

	// Metadata
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`

	// Data
	Data map[string]string `json:"data,omitempty"`

	// Binary data
	BinaryData map[string][]byte `json:"binaryData,omitempty"`

	// Configuration
	Immutable *bool `json:"immutable,omitempty"`
}
