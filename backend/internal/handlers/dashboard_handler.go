package handlers

import (
	"github.com/nilay/k8s-orchestrator/backend/internal/services"
	"go.uber.org/zap"
)

type DashboardHandler struct {
	svc services.DeploymentService
	log *zap.Logger
}
