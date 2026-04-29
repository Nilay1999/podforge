package main

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/nilay/k8s-orchestrator/backend/internal/config"
	k8ssvc "github.com/nilay/k8s-orchestrator/backend/internal/k8s"
	"github.com/nilay/k8s-orchestrator/backend/internal/middleware/logger"
	"github.com/nilay/k8s-orchestrator/backend/internal/routes"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg)
	defer log.Sync()

	clientset, restConfig, err := k8ssvc.NewClient(cfg.Kubeconfig)
	if err != nil {
		log.Fatal("Failed to connect to K8s", zap.Error(err))
	}
	log.Info("Connected to K8s cluster")

	r := gin.New()
	routes.Setup(r, clientset, restConfig, log)

	addr := ":" + cfg.Port
	log.Info("Server starting", zap.String("addr", addr))
	if err := r.Run(addr); err != nil {
		log.Fatal("Server failed", zap.Error(err))
	}
}
