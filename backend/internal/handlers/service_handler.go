package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	"github.com/nilay/k8s-orchestrator/backend/internal/util"
	"go.uber.org/zap"
)

type ServiceHandler struct {
	svc services.KubernetesService
	log *zap.Logger
}

func NewServiceHandler(svc services.KubernetesService, log *zap.Logger) *ServiceHandler {
	return &ServiceHandler{svc: svc, log: log}
}

func (h *ServiceHandler) Create(c *gin.Context) {
	var req types.CreateServiceRequest
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

func (h *ServiceHandler) Get(c *gin.Context) {
	result, err := h.svc.Get(c, c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ServiceHandler) List(c *gin.Context) {
	result, err := h.svc.List(c, c.Param("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ServiceHandler) Delete(c *gin.Context) {
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
