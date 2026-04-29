package services

import (
	"context"
	"fmt"
	"sync"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	"golang.org/x/sync/errgroup"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type OverviewService interface {
	Deployment(ctx context.Context, namespace, name string) (types.DeploymentOverview, error)
	Pod(ctx context.Context, namespace, name string) (types.PodOverview, error)
}

type overviewService struct {
	clientset *kubernetes.Clientset
}

func NewOverviewService(clientset *kubernetes.Clientset) OverviewService {
	return &overviewService{clientset: clientset}
}

func (s *overviewService) Deployment(ctx context.Context, namespace, name string) (types.DeploymentOverview, error) {
	var (
		overview types.DeploymentOverview
		mu       sync.Mutex
	)
	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		deployment, err := s.clientset.AppsV1().Deployments(namespace).Get(ctx, name, v1.GetOptions{})
		if err != nil {
			return fmt.Errorf("deployment: %w", err)
		}
		mu.Lock()
		overview.Deployment = deployment
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		replicas, err := s.clientset.AppsV1().ReplicaSets(namespace).List(ctx, v1.ListOptions{})
		if err != nil {
			return fmt.Errorf("replicas: %w", err)
		}
		mu.Lock()
		overview.ReplicaSets = replicas.Items
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		pods, err := s.clientset.CoreV1().Pods(namespace).List(ctx, v1.ListOptions{})
		if err != nil {
			return fmt.Errorf("pods: %w", err)
		}
		mu.Lock()
		overview.Pods = pods.Items
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		events, err := s.clientset.CoreV1().Events(namespace).List(ctx, v1.ListOptions{})
		if err != nil {
			return fmt.Errorf("events: %w", err)
		}
		mu.Lock()
		overview.Events = events.Items
		mu.Unlock()
		return nil
	})

	if err := g.Wait(); err != nil {
		return types.DeploymentOverview{}, err
	}
	return types.DeploymentOverview{}, nil
}

func (s *overviewService) Pod(ctx context.Context, namespace, name string) (types.PodOverview, error) {
	return types.PodOverview{}, nil
}
