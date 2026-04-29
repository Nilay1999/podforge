package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/util"
)

type OverviewHandler struct {
	svc services.OverviewService
	log *zap.Logger
}

func NewOverviewHandler(svc services.OverviewService, log *zap.Logger) *OverviewHandler {
	return &OverviewHandler{svc: svc, log: log}
}

func (h *OverviewHandler) Deployment(c *gin.Context) {
	result, err := h.svc.Deployment(c.Request.Context(), c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *OverviewHandler) Pod(c *gin.Context) {
	result, err := h.svc.Pod(c.Request.Context(), c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}
