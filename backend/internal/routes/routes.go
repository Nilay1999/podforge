package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	handlers "github.com/nilay/incubator/backend/internal/handlers"
	"github.com/nilay/incubator/backend/internal/middleware/logger"
	"go.uber.org/zap"
	"k8s.io/client-go/kubernetes"
)

func Setup(r *gin.Engine, clientset *kubernetes.Clientset, log *zap.Logger) {
	deploymentHandler := handlers.NewDeploymentHandler(clientset)

	r.Use(logger.GinMiddleware(log))
	r.SetTrustedProxies(nil)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")
	{
		deployment := v1.Group("deployment")
		{
			deployment.POST("/", deploymentHandler.Create)
		}
	}
}
