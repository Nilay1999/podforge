package types

// ValidationError wraps input-validation failures so handlers can return 400.
type ValidationError struct{ Err error }

func (e *ValidationError) Error() string { return e.Err.Error() }
func (e *ValidationError) Unwrap() error { return e.Err }

// APIError is the canonical error envelope returned by every endpoint.
// Detail is optional and omitted when empty.
type APIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}
