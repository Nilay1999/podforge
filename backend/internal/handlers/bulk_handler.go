package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
)

type BulkHandler struct {
	svc services.BulkService
	log *zap.Logger
}

func NewBulkHandler(svc services.BulkService, log *zap.Logger) *BulkHandler {
	return &BulkHandler{svc: svc, log: log}
}

func (h *BulkHandler) Delete(c *gin.Context) {
	var req types.BulkDeleteRequest
	if !bindJSON(c, &req) {
		return
	}
	result := h.svc.Delete(c.Request.Context(), req)
	c.JSON(http.StatusOK, result)
}

func (h *BulkHandler) Apply(c *gin.Context) {
	var req types.BulkApplyRequest
	if !bindJSON(c, &req) {
		return
	}
	result := h.svc.Apply(c.Request.Context(), req)
	c.JSON(http.StatusOK, result)
}
