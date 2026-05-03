package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/nilay/k8s-orchestrator/backend/internal/handlers"
	"github.com/nilay/k8s-orchestrator/backend/internal/middleware/logger"
	"github.com/nilay/k8s-orchestrator/backend/internal/services"
)

func Setup(r *gin.Engine, clientset *kubernetes.Clientset, restConfig *rest.Config, log *zap.Logger) {
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware(log))
	r.SetTrustedProxies(nil)

	deploySvc := services.NewDeploymentService(clientset)
	podSvc := services.NewPodService(clientset)
	configMapSvc := services.NewConfigmapService(clientset)
	serviceSvc := services.NewKubernetesService(clientset)
	secretSvc := services.NewSecretService(clientset)
	dashboardSvc := services.NewDashboardService(clientset)
	overviewSvc := services.NewOverviewService(clientset)
	logSvc := services.NewLogService(clientset)
	watchSvc := services.NewWatchService(clientset)
	applySvc, err := services.NewApplyService(restConfig)
	if err != nil {
		log.Fatal("Failed to create apply service", zap.Error(err))
	}
	namespaceSvc := services.NewNamespaceService(clientset)
	bulkSvc := services.NewBulkService(serviceSvc, deploySvc, podSvc, applySvc)
	searchSvc := services.NewSearchService(clientset)

	deploymentHandler := handlers.NewDeploymentHandler(deploySvc, log)
	podHandler := handlers.NewPodHandler(podSvc, log)
	configMapHandler := handlers.NewConfigMapHandler(configMapSvc, log)
	serviceHandler := handlers.NewServiceHandler(serviceSvc, log)
	secretHandler := handlers.NewSecretHandler(secretSvc, log)
	dashboardHandler := handlers.NewDashboardHandler(dashboardSvc, log)
	overviewHandler := handlers.NewOverviewHandler(overviewSvc, log)
	logHandler := handlers.NewLogHandler(logSvc, log)
	watchHandler := handlers.NewWatchHandler(watchSvc, log)
	namespaceHandler := handlers.NewNamespaceHandler(namespaceSvc, log)
	bulkHandler := handlers.NewBulkHandler(bulkSvc, log)
	searchHandler := handlers.NewSearchHandler(searchSvc, log)

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
			deployment.GET("/:namespace/:name/overview", overviewHandler.Deployment)
			deployment.PUT("/:namespace/:name", deploymentHandler.Update)
			deployment.DELETE("/:namespace/:name", deploymentHandler.Delete)
		}

		pod := v1.Group("pod")
		{
			pod.POST("/", podHandler.Create)
			pod.GET("/:namespace", podHandler.List)
			pod.GET("/:namespace/:name", podHandler.Get)
			pod.GET("/:namespace/:name/overview", overviewHandler.Pod)
			pod.GET("/:namespace/:name/logs/stream", logHandler.Stream)
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

		dashboard := v1.Group("dashboard")
		{
			dashboard.GET("/summary", dashboardHandler.Summary)
			dashboard.GET("/pod-phases", dashboardHandler.PodPhases)
		}

		bulk := v1.Group("bulk")
		{
			bulk.POST("/delete", bulkHandler.Delete)
			bulk.POST("/apply", bulkHandler.Apply)
		}
		namespaces := v1.Group("namespaces")
		{
			namespaces.GET("/", namespaceHandler.List)
			namespaces.POST("/", namespaceHandler.Create)
			namespaces.DELETE("/:name", namespaceHandler.Delete)
		}

		v1.GET("/namespace/:namespace/overview", dashboardHandler.NamespaceOverview)
		v1.GET("/events/stream", watchHandler.Events)
		v1.GET("/watch/:kind/:namespace", watchHandler.Resource)
		v1.GET("/search", searchHandler.Search)
	}
}
