package services

import (
	"context"

	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
)

type WatchService interface {
	Events(ctx context.Context, namespace string) (watch.Interface, error)
	Resource(ctx context.Context, kind, namespace string) (watch.Interface, error)
}

type watchService struct {
	clientset *kubernetes.Clientset
}

func NewWatchService(clientset *kubernetes.Clientset) WatchService {
	return &watchService{clientset: clientset}
}

func (s *watchService) Events(ctx context.Context, namespace string) (watch.Interface, error) {
	return nil, nil
}

func (s *watchService) Resource(ctx context.Context, kind, namespace string) (watch.Interface, error) {
	return nil, nil
}
