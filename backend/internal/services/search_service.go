package services

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/podforge/backend/internal/types"
	"golang.org/x/sync/errgroup"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

// Search scans pods, deployments, services, configmaps, and secrets for resources
// whose name or labels contain query (case-insensitive). An empty namespace searches
// across all namespaces.
func (s *searchService) Search(ctx context.Context, query, namespace string) (types.SearchResult, error) {
	result := types.SearchResult{Query: query, Hits: []types.SearchHit{}}
	if strings.TrimSpace(query) == "" {
		return result, nil
	}
	needle := strings.ToLower(query)

	var mu sync.Mutex
	add := func(kind, ns, name string) {
		mu.Lock()
		result.Hits = append(result.Hits, types.SearchHit{Kind: kind, Namespace: ns, Name: name})
		mu.Unlock()
	}

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("pods: %w", err)
		}
		for _, item := range list.Items {
			if matchesSearch(needle, item.Name, item.Labels) {
				add("Pod", item.Namespace, item.Name)
			}
		}
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("deployments: %w", err)
		}
		for _, item := range list.Items {
			if matchesSearch(needle, item.Name, item.Labels) {
				add("Deployment", item.Namespace, item.Name)
			}
		}
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("services: %w", err)
		}
		for _, item := range list.Items {
			if matchesSearch(needle, item.Name, item.Labels) {
				add("Service", item.Namespace, item.Name)
			}
		}
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("configmaps: %w", err)
		}
		for _, item := range list.Items {
			if matchesSearch(needle, item.Name, item.Labels) {
				add("ConfigMap", item.Namespace, item.Name)
			}
		}
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("secrets: %w", err)
		}
		for _, item := range list.Items {
			if matchesSearch(needle, item.Name, item.Labels) {
				add("Secret", item.Namespace, item.Name)
			}
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return types.SearchResult{Query: query, Hits: []types.SearchHit{}}, err
	}
	return result, nil
}

// matchesSearch reports whether needle (already lower-cased) appears in the
// resource name or any of its label keys or values.
func matchesSearch(needle, name string, labels map[string]string) bool {
	if strings.Contains(strings.ToLower(name), needle) {
		return true
	}
	for k, v := range labels {
		if strings.Contains(strings.ToLower(k), needle) || strings.Contains(strings.ToLower(v), needle) {
			return true
		}
	}
	return false
}
