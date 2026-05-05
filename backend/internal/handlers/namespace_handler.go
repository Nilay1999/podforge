package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
)

type NamespaceHandler struct {
	svc services.NamespaceService
	log *zap.Logger
}

func NewNamespaceHandler(svc services.NamespaceService, log *zap.Logger) *NamespaceHandler {
	return &NamespaceHandler{svc: svc, log: log}
}

func (h *NamespaceHandler) List(c *gin.Context) {
	result, err := h.svc.List(c.Request.Context())
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *NamespaceHandler) Create(c *gin.Context) {
	var req types.CreateNamespaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}

	c.JSON(http.StatusCreated, types.CreateResponse{
		Name:      result.Name,
		Namespace: result.Name,
		Status:    "created",
	})
}

func (h *NamespaceHandler) Delete(c *gin.Context) {
	name := c.Param("name")

	if err := h.svc.Delete(c.Request.Context(), name); err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}

	c.JSON(http.StatusOK, types.CreateResponse{
		Name:      name,
		Namespace: name,
		Status:    "deleted",
	})
}
