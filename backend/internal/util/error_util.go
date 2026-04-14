package util

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

func CreateErrorResponse(c *gin.Context, err error) {
	var ve *types.ValidationError
	switch {
	case errors.As(err, &ve):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case k8serrors.IsNotFound(err):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case k8serrors.IsAlreadyExists(err):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case k8serrors.IsInvalid(err):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
