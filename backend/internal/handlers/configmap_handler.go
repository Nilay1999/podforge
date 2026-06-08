package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
)

type ConfigmapHandler struct {
	svc services.ConfigmapService
	log *zap.Logger
}

func NewConfigMapHandler(svc services.ConfigmapService, log *zap.Logger) *ConfigmapHandler {
	return &ConfigmapHandler{svc: svc, log: log}
}

func (h *ConfigmapHandler) Create(c *gin.Context) {
	var req types.CreateConfigmapRequest
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
		Namespace: result.Namespace,
		Status:    "created",
	})
}

func (h *ConfigmapHandler) Get(c *gin.Context) {
	result, err := h.svc.Get(c.Request.Context(), c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ConfigmapHandler) List(c *gin.Context) {
	result, err := h.svc.List(c.Request.Context(), c.Param("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ConfigmapHandler) Update(c *gin.Context) {
	var req types.CreateConfigmapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.Namespace = c.Param("namespace")
	req.Name = c.Param("name")

	result, err := h.svc.Update(c.Request.Context(), req)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}

	c.JSON(http.StatusOK, types.CreateResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "updated",
	})
}

func (h *ConfigmapHandler) Delete(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if err := h.svc.Delete(c.Request.Context(), namespace, name); err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}

	c.JSON(http.StatusOK, types.CreateResponse{
		Name:      name,
		Namespace: namespace,
		Status:    "deleted",
	})
}
