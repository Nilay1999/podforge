package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	k8s "github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/kubernetes"
)

type ConfigmapHandler struct {
	clientset *kubernetes.Clientset
}

func NewConfigMap(clientset *kubernetes.Clientset) *ConfigmapHandler {
	return &ConfigmapHandler{clientset: clientset}
}

func (h *ConfigmapHandler) Create(c *gin.Context) {
	var req types.CreateConfigmapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := k8s.CreateConfigmap(c.Request.Context(), h.clientset, req)
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
	c.JSON(http.StatusCreated, types.CreateResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "created",
	})
}
