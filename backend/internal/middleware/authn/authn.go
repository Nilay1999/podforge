package authn

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/auth"
)

const identityKey = "podforge/identity"

func Authenticate(log *zap.Logger, verifiers ...auth.Verifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			abort(c, "missing bearer token")
			return
		}

		for _, v := range verifiers {
			id, err := v.Verify(c.Request.Context(), token)
			if err == nil {
				c.Set(identityKey, id)
				c.Next()
				return
			}
			log.Debug("token verification failed", zap.Error(err))
		}
		abort(c, "invalid or expired token")
	}
}

// RequireMethodRole authorizes by HTTP method: reads need viewer, mutations need editor.
func RequireMethodRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		required := auth.RoleEditor
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead {
			required = auth.RoleViewer
		}
		enforce(c, required)
	}
}

func RequireRole(required auth.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		enforce(c, required)
	}
}

func enforce(c *gin.Context, required auth.Role) {
	id := IdentityFrom(c)
	if id == nil {
		abort(c, "missing bearer token")
		return
	}
	if !id.Role.AtLeast(required) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "requires " + string(required) + " role"})
		return
	}
	c.Next()
}

func IdentityFrom(c *gin.Context) *auth.Identity {
	if v, ok := c.Get(identityKey); ok {
		if id, ok := v.(*auth.Identity); ok {
			return id
		}
	}
	return nil
}

// extractToken reads the Authorization header, falling back to the token query
// parameter because EventSource cannot set request headers on SSE connections.
func extractToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	}
	return c.Query("token")
}

func abort(c *gin.Context, msg string) {
	c.Header("WWW-Authenticate", "Bearer")
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": msg})
}
