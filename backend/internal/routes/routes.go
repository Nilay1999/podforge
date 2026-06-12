package routes

import (
	"context"
	"net/http"
	"time"

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
	"github.com/podforge/backend/internal/store"
)

func setupAuth(cfg config.Config, log *zap.Logger) (*auth.LocalAuthenticator, *auth.OIDCVerifier, *store.Store, []auth.Verifier) {
	if !cfg.Auth.Enabled {
		log.Warn("authentication is DISABLED; every request has full cluster access")
		return nil, nil, nil, nil
	}

	var verifiers []auth.Verifier
	var localAuth *auth.LocalAuthenticator
	var oidcVerifier *auth.OIDCVerifier
	var userStore *store.Store

	if cfg.Auth.JWTSecret != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var err error
		userStore, err = store.Open(ctx, store.Options{
			PostgresDSN: cfg.Database.PostgresDSN,
			SQLitePath:  cfg.Database.SQLitePath,
		})
		if err != nil {
			log.Fatal("Failed to open user database", zap.Error(err))
		}
		log.Info("User database ready", zap.String("dialect", userStore.Dialect()))

		seed := make([]store.User, 0, len(cfg.Auth.Users))
		for _, u := range cfg.Auth.Users {
			if _, err := auth.ParseRole(u.Role); err != nil {
				log.Fatal("Invalid auth config", zap.String("user", u.Username), zap.Error(err))
			}
			if err := auth.ValidatePasswordHash(u.PasswordHash); err != nil {
				log.Fatal("Invalid auth config", zap.String("user", u.Username), zap.Error(err))
			}
			seed = append(seed, store.User{Username: u.Username, PasswordHash: u.PasswordHash, Role: u.Role})
		}
		created, err := userStore.SeedUsers(ctx, seed)
		if err != nil {
			log.Fatal("Failed to seed users", zap.Error(err))
		}
		if created > 0 {
			log.Info("Seeded users from config", zap.Int("created", created))
		}
		if total, err := userStore.CountUsers(ctx); err == nil && total == 0 {
			log.Warn("User database is empty; local login will reject everyone until users are added via auth.users config or POST /api/v1/auth/users")
		}

		localAuth, err = auth.NewLocalAuthenticator(cfg.Auth.JWTSecret, cfg.Auth.TokenTTL, userStore)
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
			Issuer:         cfg.Auth.OIDC.Issuer,
			ClientID:       cfg.Auth.OIDC.ClientID,
			UsernameClaim:  cfg.Auth.OIDC.UsernameClaim,
			RolesClaim:     cfg.Auth.OIDC.RolesClaim,
			RoleMapping:    roleMapping,
			DefaultRole:    auth.Role(cfg.Auth.OIDC.DefaultRole),
			AllowedDomains: cfg.Auth.OIDC.AllowedDomains,
		})
		if err != nil {
			log.Fatal("Invalid oidc config", zap.Error(err))
		}
		verifiers = append(verifiers, oidcVerifier)
	}

	if len(verifiers) == 0 {
		log.Fatal("Auth is enabled but no providers configured; set auth.jwt.secret (local login) or auth.oidc, or set auth.enabled: false")
	}
	return localAuth, oidcVerifier, userStore, verifiers
}

func Setup(r *gin.Engine, cfg config.Config, clientset *kubernetes.Clientset, restConfig *rest.Config, log *zap.Logger) {
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware(log))
	r.SetTrustedProxies(nil)

	localAuth, oidcVerifier, userStore, verifiers := setupAuth(cfg, log)

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
	applyHandler := handlers.NewApplyHandler(applySvc, log)
	bulkHandler := handlers.NewBulkHandler(bulkSvc, log)
	searchHandler := handlers.NewSearchHandler(searchSvc, log)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	authHandler := handlers.NewAuthHandler(localAuth, oidcVerifier, userStore, log)

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

		if localAuth != nil {
			users := v1.Group("auth/users", adminOnly)
			{
				users.GET("/", authHandler.ListUsers)
				users.POST("/", authHandler.CreateUser)
				users.PUT("/:username", authHandler.UpdateUser)
				users.DELETE("/:username", authHandler.DeleteUser)
			}
		}

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

		v1.POST("/apply", applyHandler.Apply)
		v1.GET("/namespace/:namespace/overview", dashboardHandler.NamespaceOverview)
		v1.GET("/events/stream", watchHandler.Events)
		v1.GET("/watch/:kind/:namespace", watchHandler.Resource)
		v1.GET("/search", searchHandler.Search)
	}
}
