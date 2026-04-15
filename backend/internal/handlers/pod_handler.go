package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	"github.com/nilay/k8s-orchestrator/backend/internal/util"
)

type PodHandler struct {
	svc services.PodService
	log *zap.Logger
}

func NewPodHandler(svc services.PodService, log *zap.Logger) *PodHandler {
	return &PodHandler{svc: svc, log: log}
}

func (h *PodHandler) Create(c *gin.Context) {
	var req types.CreatePodRequest
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

func (h *PodHandler) Get(c *gin.Context) {
	result, err := h.svc.Get(c.Request.Context(), c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *PodHandler) List(c *gin.Context) {
	result, err := h.svc.List(c.Request.Context(), c.Param("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *PodHandler) Update(c *gin.Context) {
	var req types.CreatePodRequest
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

func (h *PodHandler) Delete(c *gin.Context) {
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
