package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
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
	return types.DeploymentOverview{}, nil
}

func (s *overviewService) Pod(ctx context.Context, namespace, name string) (types.PodOverview, error) {
	return types.PodOverview{}, nil
}
