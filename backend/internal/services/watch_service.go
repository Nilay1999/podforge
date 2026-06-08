package services

import (
	"context"
	"fmt"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	return s.clientset.CoreV1().Events(namespace).Watch(ctx, metav1.ListOptions{})
}

func (s *watchService) Resource(ctx context.Context, kind, namespace string) (watch.Interface, error) {
	opts := metav1.ListOptions{}
	switch strings.ToLower(kind) {
	case "pod", "pods":
		return s.clientset.CoreV1().Pods(namespace).Watch(ctx, opts)
	case "deployment", "deployments":
		return s.clientset.AppsV1().Deployments(namespace).Watch(ctx, opts)
	case "service", "services":
		return s.clientset.CoreV1().Services(namespace).Watch(ctx, opts)
	case "configmap", "configmaps":
		return s.clientset.CoreV1().ConfigMaps(namespace).Watch(ctx, opts)
	case "secret", "secrets":
		return s.clientset.CoreV1().Secrets(namespace).Watch(ctx, opts)
	default:
		return nil, fmt.Errorf("unsupported resource kind: %s", kind)
	}
}
