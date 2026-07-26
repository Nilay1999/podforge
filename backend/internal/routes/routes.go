package routes

import (
	"context"
	"fmt"
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

// handlerSet holds every HTTP handler, wired to its backing service. It keeps
// Setup focused on the route table rather than dependency construction.
type handlerSet struct {
	deployment *handlers.DeploymentHandler
	pod        *handlers.PodHandler
	configMap  *handlers.ConfigmapHandler
	service    *handlers.ServiceHandler
	secret     *handlers.SecretHandler
	dashboard  *handlers.DashboardHandler
	overview   *handlers.OverviewHandler
	log        *handlers.LogHandler
	watch      *handlers.WatchHandler
	namespace  *handlers.NamespaceHandler
	node       *handlers.NodeHandler
	apply      *handlers.ApplyHandler
	bulk       *handlers.BulkHandler
	search     *handlers.SearchHandler
	auth       *handlers.AuthHandler
}

func buildHandlers(clientset *kubernetes.Clientset, restConfig *rest.Config, log *zap.Logger, localAuth *auth.LocalAuthenticator, oidcVerifier *auth.OIDCVerifier, userStore *store.Store) (*handlerSet, error) {
	deploySvc := services.NewDeploymentService(clientset)
	podSvc := services.NewPodService(clientset)
	configMapSvc := services.NewConfigmapService(clientset)
	serviceSvc := services.NewServiceService(clientset)
	secretSvc := services.NewSecretService(clientset)
	dashboardSvc := services.NewDashboardService(clientset)
	overviewSvc := services.NewOverviewService(clientset)
	logSvc := services.NewLogService(clientset)
	watchSvc := services.NewWatchService(clientset)
	namespaceSvc := services.NewNamespaceService(clientset)
	nodeSvc := services.NewNodeService(clientset)
	searchSvc := services.NewSearchService(clientset)

	applySvc, err := services.NewApplyService(restConfig)
	if err != nil {
		return nil, fmt.Errorf("apply service: %w", err)
	}
	bulkSvc := services.NewBulkService(serviceSvc, deploySvc, podSvc, applySvc)

	return &handlerSet{
		deployment: handlers.NewDeploymentHandler(deploySvc, log),
		pod:        handlers.NewPodHandler(podSvc, log),
		configMap:  handlers.NewConfigMapHandler(configMapSvc, log),
		service:    handlers.NewServiceHandler(serviceSvc, log),
		secret:     handlers.NewSecretHandler(secretSvc, log),
		dashboard:  handlers.NewDashboardHandler(dashboardSvc, log),
		overview:   handlers.NewOverviewHandler(overviewSvc, log),
		log:        handlers.NewLogHandler(logSvc, log),
		watch:      handlers.NewWatchHandler(watchSvc, log),
		namespace:  handlers.NewNamespaceHandler(namespaceSvc, log),
		node:       handlers.NewNodeHandler(nodeSvc, log),
		apply:      handlers.NewApplyHandler(applySvc, log),
		bulk:       handlers.NewBulkHandler(bulkSvc, log),
		search:     handlers.NewSearchHandler(searchSvc, log),
		auth:       handlers.NewAuthHandler(localAuth, oidcVerifier, userStore, log),
	}, nil
}

// syncConfigUsers reconciles auth.users with the database. Users declared with a
// plaintext `password` are kept in sync on every boot (so editing config.yaml
// actually changes the login); users declared with a bcrypt `password_hash` are
// inserted only if missing, so runtime password/role changes are preserved.
func syncConfigUsers(ctx context.Context, userStore *store.Store, users []config.UserConfig, log *zap.Logger) error {
	seed := make([]store.User, 0, len(users))

	for _, u := range users {
		if _, err := auth.ParseRole(u.Role); err != nil {
			return fmt.Errorf("user %s: %w", u.Username, err)
		}
		if u.Password != "" && u.PasswordHash != "" {
			return fmt.Errorf("user %s: set either password or password_hash, not both", u.Username)
		}

		if u.Password != "" {
			hash, err := auth.HashPassword(u.Password)
			if err != nil {
				return fmt.Errorf("user %s: %w", u.Username, err)
			}
			if err := userStore.UpsertUser(ctx, u.Username, hash, u.Role); err != nil {
				return fmt.Errorf("user %s: %w", u.Username, err)
			}
			continue
		}

		if err := auth.ValidatePasswordHash(u.PasswordHash); err != nil {
			return fmt.Errorf("user %s: %w", u.Username, err)
		}
		seed = append(seed, store.User{Username: u.Username, PasswordHash: u.PasswordHash, Role: u.Role})
	}

	created, err := userStore.SeedUsers(ctx, seed)
	if err != nil {
		return err
	}
	if created > 0 {
		log.Info("Seeded users from config", zap.Int("created", created))
	}
	return nil
}

func setupAuth(cfg config.Config, log *zap.Logger) (*auth.LocalAuthenticator, *auth.OIDCVerifier, *store.Store, []auth.Verifier) {
	if !cfg.Auth.Enabled {
		log.Warn("authentication is DISABLED; every request has full cluster access")
		return nil, nil, nil, nil
	}

	var verifiers []auth.Verifier
	var localAuth *auth.LocalAuthenticator
	var oidcVerifier *auth.OIDCVerifier
	var userStore *store.Store

	if cfg.Auth.JWTSecret == "" && cfg.IsDevelopment() {
		cfg.Auth.JWTSecret = config.DevJWTSecret
		log.Warn("No auth.jwt.secret configured; using the built-in development secret. Set auth.jwt.secret (or AUTH_JWT_SECRET) before deploying")
	}

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

		users := cfg.Auth.Users
		if len(users) == 0 && cfg.IsDevelopment() {
			users = []config.UserConfig{{
				Username: config.DevUsername,
				Password: config.DevPassword,
				Role:     string(auth.RoleAdmin),
			}}
			log.Warn("No auth.users configured; using the default development login",
				zap.String("username", config.DevUsername), zap.String("password", config.DevPassword))
		}
		if err := syncConfigUsers(ctx, userStore, users, log); err != nil {
			log.Fatal("Failed to seed users", zap.Error(err))
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

	h, err := buildHandlers(clientset, restConfig, log, localAuth, oidcVerifier, userStore)
	if err != nil {
		log.Fatal("Failed to build handlers", zap.Error(err))
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/login", h.auth.Login)
		v1.GET("/auth/providers", h.auth.Providers(cfg.Auth.OIDC.Issuer, cfg.Auth.OIDC.ClientID, cfg.Auth.Enabled))

		adminOnly := gin.HandlerFunc(func(c *gin.Context) { c.Next() })
		if cfg.Auth.Enabled {
			v1.Use(authn.Authenticate(log, verifiers...), authn.RequireMethodRole())
			adminOnly = authn.RequireRole(auth.RoleAdmin)
		}

		v1.GET("/auth/me", h.auth.Me)

		if localAuth != nil {
			users := v1.Group("auth/users", adminOnly)
			{
				users.GET("/", h.auth.ListUsers)
				users.POST("/", h.auth.CreateUser)
				users.PUT("/:username", h.auth.UpdateUser)
				users.DELETE("/:username", h.auth.DeleteUser)
			}
		}

		deployment := v1.Group("deployment")
		{
			deployment.POST("/", h.deployment.Create)
			deployment.GET("/:namespace", h.deployment.List)
			deployment.GET("/:namespace/:name", h.deployment.Get)
			deployment.GET("/:namespace/:name/overview", h.overview.Deployment)
			deployment.PUT("/:namespace/:name", h.deployment.Update)
			deployment.DELETE("/:namespace/:name", h.deployment.Delete)
			deployment.PATCH("/:namespace/:name/scale", h.deployment.Scale)
			deployment.POST("/:namespace/:name/restart", h.deployment.Restart)
		}

		pod := v1.Group("pod")
		{
			pod.POST("/", h.pod.Create)
			pod.GET("/:namespace", h.pod.List)
			pod.GET("/:namespace/:name", h.pod.Get)
			pod.GET("/:namespace/:name/overview", h.overview.Pod)
			pod.GET("/:namespace/:name/logs/stream", h.log.Stream)
			pod.PUT("/:namespace/:name", h.pod.Update)
			pod.DELETE("/:namespace/:name", h.pod.Delete)
		}

		configMap := v1.Group("config-map")
		{
			configMap.POST("/", h.configMap.Create)
			configMap.GET("/:namespace", h.configMap.List)
			configMap.GET("/:namespace/:name", h.configMap.Get)
			configMap.PUT("/:namespace/:name", h.configMap.Update)
			configMap.DELETE("/:namespace/:name", h.configMap.Delete)
		}

		service := v1.Group("service")
		{
			service.POST("/", h.service.Create)
			service.GET("/:namespace", h.service.List)
			service.GET("/:namespace/:name", h.service.Get)
			service.PUT("/:namespace/:name", h.service.Update)
			service.DELETE("/:namespace/:name", h.service.Delete)
		}

		secret := v1.Group("secret")
		{
			secret.POST("/", h.secret.Create)
			secret.GET("/:namespace", h.secret.List)
			secret.GET("/:namespace/:name", h.secret.Get)
			secret.PUT("/:namespace/:name", h.secret.Update)
			secret.DELETE("/:namespace/:name", h.secret.Delete)
		}

		dashboard := v1.Group("dashboard")
		{
			dashboard.GET("/summary", h.dashboard.Summary)
			dashboard.GET("/pod-phases", h.dashboard.PodPhases)
		}

		bulk := v1.Group("bulk", adminOnly)
		{
			bulk.POST("/delete", h.bulk.Delete)
			bulk.POST("/apply", h.bulk.Apply)
		}
		namespaces := v1.Group("namespaces")
		{
			namespaces.GET("/", h.namespace.List)
			namespaces.POST("/", adminOnly, h.namespace.Create)
			namespaces.DELETE("/:name", adminOnly, h.namespace.Delete)
		}

		node := v1.Group("node")
		{
			node.GET("/", h.node.List)
			node.GET("/:name", h.node.Get)
		}

		v1.POST("/apply", h.apply.Apply)
		v1.GET("/namespace/:namespace/overview", h.dashboard.NamespaceOverview)
		v1.GET("/events/stream", h.watch.Events)
		v1.GET("/watch/:kind/:namespace", h.watch.Resource)
		v1.GET("/search", h.search.Search)
	}
}
