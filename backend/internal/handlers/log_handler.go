package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/nilay/k8s-orchestrator/backend/internal/services"
)

type LogHandler struct {
	svc services.LogService
	log *zap.Logger
}

func NewLogHandler(svc services.LogService, log *zap.Logger) *LogHandler {
	return &LogHandler{svc: svc, log: log}
}

func (h *LogHandler) Stream(c *gin.Context) {
}
