package main

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/config"
	k8ssvc "github.com/podforge/backend/internal/k8s"
	"github.com/podforge/backend/internal/middleware/logger"
	"github.com/podforge/backend/internal/routes"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg)
	defer log.Sync()

	clientset, restConfig, err := k8ssvc.NewClient(cfg.Kubeconfig, cfg.KubeContext)
	if err != nil {
		log.Fatal("Failed to connect to K8s", zap.Error(err))
	}
	log.Info("Connected to K8s cluster")

	r := gin.New()
	routes.Setup(r, cfg, clientset, restConfig, log)

	addr := ":" + cfg.Port
	log.Info("Server starting", zap.String("addr", addr))
	if err := r.Run(addr); err != nil {
		log.Fatal("Server failed", zap.Error(err))
	}
}
