package main

import (
	"log"

	k8sclient "github.com/nilay/incubator/backend/internal/k8s"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Connect to K8s first
	_, err := k8sclient.NewClient()
	if err != nil {
		log.Fatalf("Failed to connect to K8s: %v", err)
	}
	log.Println("Connected to K8s cluster ✓")

	// 2. Setup Gin
	r := gin.Default()

	// 3. Health check — always have this
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 4. Start server
	log.Println("Server running on :8080")
	r.Run(":8080")
}
