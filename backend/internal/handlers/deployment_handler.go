package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	"github.com/nilay/k8s-orchestrator/backend/internal/util"
)

type DeploymentHandler struct {
	svc services.DeploymentService
	log *zap.Logger
}

func NewDeploymentHandler(svc services.DeploymentService, log *zap.Logger) *DeploymentHandler {
	return &DeploymentHandler{svc: svc, log: log}
}

func (h *DeploymentHandler) Create(c *gin.Context) {
	var req types.CreateDeploymentRequest
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

func (h *DeploymentHandler) Get(c *gin.Context) {
	req := types.GetDeploymentByName{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}

	result, err := h.svc.Get(c.Request.Context(), req)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *DeploymentHandler) List(c *gin.Context) {
	result, err := h.svc.List(c.Request.Context(), c.Param("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *DeploymentHandler) Update(c *gin.Context) {
	var req types.CreateDeploymentRequest
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

func (h *DeploymentHandler) Delete(c *gin.Context) {
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
