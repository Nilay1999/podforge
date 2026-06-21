package util

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/podforge/backend/internal/types"
	"go.uber.org/zap"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// RespondError writes the canonical {code, message} error envelope.
func RespondError(c *gin.Context, code int, message string) {
	c.JSON(code, types.APIError{Code: code, Message: message})
}

// AbortError writes the canonical error envelope and aborts the handler chain.
// Used by middleware that must short-circuit (auth, authorization).
func AbortError(c *gin.Context, code int, message string) {
	c.AbortWithStatusJSON(code, types.APIError{Code: code, Message: message})
}

// CreateErrorResponse maps service-layer errors to HTTP status codes. Client-fixable
// errors expose their message; internal errors are logged and returned opaquely so
// implementation detail never leaks to the caller.
func CreateErrorResponse(c *gin.Context, log *zap.Logger, err error) {
	var ve *types.ValidationError
	switch {
	case errors.As(err, &ve):
		RespondError(c, http.StatusBadRequest, err.Error())
	case k8serrors.IsNotFound(err):
		RespondError(c, http.StatusNotFound, err.Error())
	case k8serrors.IsAlreadyExists(err):
		RespondError(c, http.StatusConflict, err.Error())
	case k8serrors.IsInvalid(err):
		RespondError(c, http.StatusBadRequest, err.Error())
	default:
		log.Error("internal server error", zap.Error(err))
		RespondError(c, http.StatusInternalServerError, "internal server error")
	}
}
