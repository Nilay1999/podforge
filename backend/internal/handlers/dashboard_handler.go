package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/util"
)

type DashboardHandler struct {
	svc services.DashboardService
	log *zap.Logger
}

func NewDashboardHandler(svc services.DashboardService, log *zap.Logger) *DashboardHandler {
	return &DashboardHandler{svc: svc, log: log}
}

func (h *DashboardHandler) Summary(c *gin.Context) {
	result, err := h.svc.Summary(c.Request.Context(), c.Query("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *DashboardHandler) PodPhases(c *gin.Context) {
	result, err := h.svc.PodPhases(c.Request.Context(), c.Query("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *DashboardHandler) NamespaceOverview(c *gin.Context) {
	result, err := h.svc.NamespaceOverview(c.Request.Context(), c.Param("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}
