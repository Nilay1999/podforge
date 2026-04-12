package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/kubernetes"

	k8s "github.com/nilay/incubator/backend/internal/services"
	"github.com/nilay/incubator/backend/internal/types"
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
		var ve *types.ValidationError
		switch {
		case errors.As(err, &ve):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case k8serrors.IsAlreadyExists(err):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case k8serrors.IsInvalid(err):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, types.CreateDeploymentResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "created",
	})
}
