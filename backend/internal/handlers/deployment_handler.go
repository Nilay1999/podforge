package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"k8s.io/client-go/kubernetes"

	k8s "github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	"github.com/nilay/k8s-orchestrator/backend/internal/util"
)

type DeploymentHandler struct {
	clientset *kubernetes.Clientset
}

func NewDeploymentHandler(clientset *kubernetes.Clientset) *DeploymentHandler {
	return &DeploymentHandler{clientset: clientset}
}

func (h *DeploymentHandler) Create(c *gin.Context) {
	var req types.CreateDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := k8s.CreateDeployment(c.Request.Context(), h.clientset, req)
	if err != nil {
		util.CreateErrorResponse(c, err)
		return
	}

	c.JSON(http.StatusCreated, types.CreateResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "created",
	})
}

func (h *DeploymentHandler) Get(c *gin.Context) {
	req := types.GetDeployementByName{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}

	result, err := k8s.GetDeployementByName(c.Request.Context(), h.clientset, req)
	if err != nil {
		util.CreateErrorResponse(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *DeploymentHandler) List(c *gin.Context) {
	namespace := c.Param("namespace")

	result, err := k8s.ListDeployments(c.Request.Context(), h.clientset, namespace)
	if err != nil {
		util.CreateErrorResponse(c, err)
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

	result, err := k8s.UpdateDeployment(c.Request.Context(), h.clientset, req)
	if err != nil {
		util.CreateErrorResponse(c, err)
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

	if err := k8s.DeleteDeployment(c.Request.Context(), h.clientset, namespace, name); err != nil {
		util.CreateErrorResponse(c, err)
		return
	}

	c.JSON(http.StatusOK, types.CreateResponse{
		Name:      name,
		Namespace: namespace,
		Status:    "deleted",
	})
}
