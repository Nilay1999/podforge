package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	k8s "github.com/nilay/incubator/backend/internal/services"
	"github.com/nilay/incubator/backend/internal/types"
	"k8s.io/client-go/kubernetes"
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, types.CreateDeploymentResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "created",
	})
}
