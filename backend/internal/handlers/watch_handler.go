package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/nilay/k8s-orchestrator/backend/internal/services"
)

type WatchHandler struct {
	svc services.WatchService
	log *zap.Logger
}

func NewWatchHandler(svc services.WatchService, log *zap.Logger) *WatchHandler {
	return &WatchHandler{svc: svc, log: log}
}

func (h *WatchHandler) Events(c *gin.Context) {
}

func (h *WatchHandler) Resource(c *gin.Context) {
}
