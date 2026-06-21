package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/util"
)

type NodeHandler struct {
	svc services.NodeService
	log *zap.Logger
}

func NewNodeHandler(svc services.NodeService, log *zap.Logger) *NodeHandler {
	return &NodeHandler{svc: svc, log: log}
}

func (h *NodeHandler) List(c *gin.Context) {
	result, err := h.svc.List(c.Request.Context())
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *NodeHandler) Get(c *gin.Context) {
	result, err := h.svc.Get(c.Request.Context(), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}
