package main

import (
	"github.com/gin-gonic/gin"
	k8ssvc "github.com/nilay/incubator/backend/internal/k8s"
	"github.com/nilay/incubator/backend/internal/middleware/logger"
	"github.com/nilay/incubator/backend/internal/routes"
	"go.uber.org/zap"
)

func main() {
	log := logger.New()
	defer log.Sync()

	clientset, err := k8ssvc.NewClient()
	if err != nil {
		log.Fatal("Failed to connect to K8s", zap.Error(err))
	}
	log.Info("Connected to K8s cluster")

	r := gin.New()
	routes.Setup(r, clientset, log)

	log.Info("Server starting", zap.String("addr", ":8080"))
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server failed", zap.Error(err))
	}
}
