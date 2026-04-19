package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"k8s.io/client-go/kubernetes"

	"github.com/nilay/k8s-orchestrator/backend/internal/handlers"
	"github.com/nilay/k8s-orchestrator/backend/internal/middleware/logger"
	"github.com/nilay/k8s-orchestrator/backend/internal/services"
)

func Setup(r *gin.Engine, clientset *kubernetes.Clientset, log *zap.Logger) {
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware(log))
	r.SetTrustedProxies(nil)

	deploySvc := services.NewDeploymentService(clientset)
	podSvc := services.NewPodService(clientset)
	configMapSvc := services.NewConfigmapService(clientset)
	serviceSvc := services.NewKubernetesService(clientset)
	secretSvc := services.NewSecretService(clientset)

	deploymentHandler := handlers.NewDeploymentHandler(deploySvc, log)
	podHandler := handlers.NewPodHandler(podSvc, log)
	configMapHandler := handlers.NewConfigMapHandler(configMapSvc, log)
	serviceHandler := handlers.NewServiceHandler(serviceSvc, log)
	secretHandler := handlers.NewSecretHandler(secretSvc, log)

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

		service := v1.Group("service")
		{
			service.POST("/", serviceHandler.Create)
			service.GET("/:namespace", serviceHandler.List)
			service.GET("/:namespace/:name", serviceHandler.Get)
			service.PUT("/:namespace/:name", serviceHandler.Update)
			service.DELETE("/:namespace/:name", serviceHandler.Delete)
		}

		secret := v1.Group("secret")
		{
			secret.POST("/", secretHandler.Create)
			secret.GET("/:namespace", secretHandler.List)
			secret.GET("/:namespace/:name", secretHandler.Get)
			secret.PUT("/:namespace/:name", secretHandler.Update)
			secret.DELETE("/:namespace/:name", secretHandler.Delete)
		}
	}
}
