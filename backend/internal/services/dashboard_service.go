package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type DashboardService interface {
	Summary(ctx context.Context, namespace string) (types.DashboardSummary, error)
	PodPhases(ctx context.Context, namespace string) (types.PodPhaseCounts, error)
	NamespaceOverview(ctx context.Context, namespace string) (types.NamespaceOverview, error)
}

type dashboardService struct {
	clientset *kubernetes.Clientset
}

func NewDashboardService(clientset *kubernetes.Clientset) DashboardService {
	return &dashboardService{clientset: clientset}
}

func (s *dashboardService) Summary(ctx context.Context, namespace string) (types.DashboardSummary, error) {
	pods, err := s.clientset.CoreV1().Pods(namespace).List(ctx, v1.ListOptions{})
	if err != nil {
		return types.DashboardSummary{}, err
	}

	return types.DashboardSummary{
		Pods: len(pods.Items),
	}, nil
}

func (s *dashboardService) PodPhases(ctx context.Context, namespace string) (types.PodPhaseCounts, error) {
	return types.PodPhaseCounts{}, nil
}

func (s *dashboardService) NamespaceOverview(ctx context.Context, namespace string) (types.NamespaceOverview, error) {
	return types.NamespaceOverview{Namespace: namespace}, nil
}
