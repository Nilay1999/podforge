package types

type CreateSecretRequest struct {
	// Core
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace" binding:"required"`

	// Metadata
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`

	// Type:
	//   Opaque (default) | kubernetes.io/service-account-token |
	//   kubernetes.io/dockercfg | kubernetes.io/dockerconfigjson |
	//   kubernetes.io/basic-auth | kubernetes.io/ssh-auth |
	//   kubernetes.io/tls | bootstrap.kubernetes.io/token
	Type string `json:"type,omitempty"`

	// StringData accepts plain-text values. The apiserver base64-encodes
	// them into Data on write. Preferred for UI-supplied secrets.
	StringData map[string]string `json:"stringData,omitempty"`

	// Data accepts already-encoded bytes. JSON will base64-encode []byte
	// automatically on the wire.
	Data map[string][]byte `json:"data,omitempty"`

	// Immutable secrets cannot be edited after creation.
	Immutable *bool `json:"immutable,omitempty"`
}
