package services

import (
	"context"

	"k8s.io/client-go/kubernetes"
)

type DashboardService interface {
	GenerateSummary(ctx context.Context)
	GetPodPhases(ctx context.Context)
}

type dashboardService struct {
	clientset *kubernetes.Clientset
}

func NewDashboardService(clientset *kubernetes.Clientset) DashboardService {
	return &dashboardService{clientset: clientset}
}

func (s *dashboardService) GenerateSummary(ctx context.Context) {

}

func (s *dashboardService) GetPodPhases(ctx context.Context) {
	panic("unimplemented")
}
