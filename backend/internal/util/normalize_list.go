package util

func normalizeList[T any](items *[]T) {
	if items == nil || *items == nil {
		*items = []T{}
	}
}
