package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/podforge/backend/internal/auth"
	"github.com/podforge/backend/internal/config"
	"github.com/podforge/backend/internal/handlers"
	"github.com/podforge/backend/internal/middleware/authn"
	"github.com/podforge/backend/internal/middleware/logger"
	"github.com/podforge/backend/internal/services"
)

func setupAuth(cfg config.Config, log *zap.Logger) (*auth.LocalAuthenticator, *auth.OIDCVerifier, []auth.Verifier) {
	if !cfg.Auth.Enabled {
		log.Warn("authentication is DISABLED; every request has full cluster access")
		return nil, nil, nil
	}

	var verifiers []auth.Verifier
	var localAuth *auth.LocalAuthenticator
	var oidcVerifier *auth.OIDCVerifier

	if len(cfg.Auth.Users) > 0 {
		users := make([]auth.User, 0, len(cfg.Auth.Users))
		for _, u := range cfg.Auth.Users {
			role, err := auth.ParseRole(u.Role)
			if err != nil {
				log.Fatal("Invalid auth config", zap.String("user", u.Username), zap.Error(err))
			}
			users = append(users, auth.User{Username: u.Username, PasswordHash: u.PasswordHash, Role: role})
		}
		var err error
		localAuth, err = auth.NewLocalAuthenticator(cfg.Auth.JWTSecret, cfg.Auth.TokenTTL, users)
		if err != nil {
			log.Fatal("Invalid auth config", zap.Error(err))
		}
		verifiers = append(verifiers, localAuth)
	}

	if cfg.Auth.OIDC.Enabled {
		roleMapping := make(map[string]auth.Role, len(cfg.Auth.OIDC.RoleMapping))
		for group, role := range cfg.Auth.OIDC.RoleMapping {
			roleMapping[group] = auth.Role(role)
		}
		var err error
		oidcVerifier, err = auth.NewOIDCVerifier(auth.OIDCConfig{
			Issuer:        cfg.Auth.OIDC.Issuer,
			ClientID:      cfg.Auth.OIDC.ClientID,
			UsernameClaim: cfg.Auth.OIDC.UsernameClaim,
			RolesClaim:    cfg.Auth.OIDC.RolesClaim,
			RoleMapping:   roleMapping,
			DefaultRole:   auth.Role(cfg.Auth.OIDC.DefaultRole),
		})
		if err != nil {
			log.Fatal("Invalid oidc config", zap.Error(err))
		}
		verifiers = append(verifiers, oidcVerifier)
	}

	if len(verifiers) == 0 {
		log.Fatal("Auth is enabled but no providers configured; add auth.users or auth.oidc to config, or set auth.enabled: false")
	}
	return localAuth, oidcVerifier, verifiers
}

func Setup(r *gin.Engine, cfg config.Config, clientset *kubernetes.Clientset, restConfig *rest.Config, log *zap.Logger) {
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware(log))
	r.SetTrustedProxies(nil)

	localAuth, oidcVerifier, verifiers := setupAuth(cfg, log)

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

	authHandler := handlers.NewAuthHandler(localAuth, oidcVerifier, log)

	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/login", authHandler.Login)
		v1.GET("/auth/providers", authHandler.Providers(cfg.Auth.OIDC.Issuer, cfg.Auth.OIDC.ClientID, cfg.Auth.Enabled))

		adminOnly := gin.HandlerFunc(func(c *gin.Context) { c.Next() })
		if cfg.Auth.Enabled {
			v1.Use(authn.Authenticate(log, verifiers...), authn.RequireMethodRole())
			adminOnly = authn.RequireRole(auth.RoleAdmin)
		}

		v1.GET("/auth/me", authHandler.Me)

		deployment := v1.Group("deployment")
		{
			deployment.POST("/", deploymentHandler.Create)
			deployment.GET("/:namespace", deploymentHandler.List)
			deployment.GET("/:namespace/:name", deploymentHandler.Get)
			deployment.GET("/:namespace/:name/overview", overviewHandler.Deployment)
			deployment.PUT("/:namespace/:name", deploymentHandler.Update)
			deployment.DELETE("/:namespace/:name", deploymentHandler.Delete)
			deployment.PATCH("/:namespace/:name/scale", deploymentHandler.Scale)
			deployment.POST("/:namespace/:name/restart", deploymentHandler.Restart)
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

		bulk := v1.Group("bulk", adminOnly)
		{
			bulk.POST("/delete", bulkHandler.Delete)
			bulk.POST("/apply", bulkHandler.Apply)
		}
		namespaces := v1.Group("namespaces")
		{
			namespaces.GET("/", namespaceHandler.List)
			namespaces.POST("/", adminOnly, namespaceHandler.Create)
			namespaces.DELETE("/:name", adminOnly, namespaceHandler.Delete)
		}

		v1.GET("/namespace/:namespace/overview", dashboardHandler.NamespaceOverview)
		v1.GET("/events/stream", watchHandler.Events)
		v1.GET("/watch/:kind/:namespace", watchHandler.Resource)
		v1.GET("/search", searchHandler.Search)
	}
}
