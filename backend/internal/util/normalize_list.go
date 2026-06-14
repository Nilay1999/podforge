package util

// NormalizeList ensures a slice JSON-encodes as [] rather than null when empty,
// by replacing a nil slice with an empty (non-nil) one.
func NormalizeList[T any](items *[]T) {
	if items == nil || *items == nil {
		*items = []T{}
	}
}
