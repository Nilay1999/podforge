package services

import (
	"context"

	"github.com/podforge/backend/internal/types"
	"k8s.io/client-go/kubernetes"
)

type SearchService interface {
	Search(ctx context.Context, query, namespace string) (types.SearchResult, error)
}

type searchService struct {
	clientset *kubernetes.Clientset
}

func NewSearchService(clientset *kubernetes.Clientset) SearchService {
	return &searchService{clientset: clientset}
}

func (s *searchService) Search(ctx context.Context, query, namespace string) (types.SearchResult, error) {
	return types.SearchResult{Query: query}, nil
}
