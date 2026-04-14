package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	handlers "github.com/nilay/k8s-orchestrator/backend/internal/handlers"
	"github.com/nilay/k8s-orchestrator/backend/internal/middleware/logger"
	"go.uber.org/zap"
	"k8s.io/client-go/kubernetes"
)

func Setup(r *gin.Engine, clientset *kubernetes.Clientset, log *zap.Logger) {
	deploymentHandler := handlers.NewDeploymentHandler(clientset)
	configMapHandler := handlers.NewConfigMap(clientset)
	podHandler := handlers.NewPodHandler(clientset)

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
			deployment.GET("/:namespace", deploymentHandler.List)
			deployment.GET("/:namespace/:name", deploymentHandler.Get)
			deployment.PUT("/:namespace/:name", deploymentHandler.Update)
			deployment.DELETE("/:namespace/:name", deploymentHandler.Delete)
		}

		pod := v1.Group("pod")
		{
			pod.POST("/", podHandler.Create)
			pod.GET("/:namespace", podHandler.List)
			pod.GET("/:namespace/:name", podHandler.Get)
			pod.PUT("/:namespace/:name", podHandler.Update)
			pod.DELETE("/:namespace/:name", podHandler.Delete)
		}

		configMap := v1.Group("config-map")
		{
			configMap.POST("/", configMapHandler.Create)
			configMap.GET("/:namespace", configMapHandler.List)
			configMap.GET("/:namespace/:name", configMapHandler.Get)
			configMap.PUT("/:namespace/:name", configMapHandler.Update)
			configMap.DELETE("/:namespace/:name", configMapHandler.Delete)
		}
	}
}
