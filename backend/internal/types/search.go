package types

type SearchHit struct {
	Kind      string `json:"kind"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
}

type SearchResult struct {
	Query string      `json:"query"`
	Hits  []SearchHit `json:"hits"`
}
