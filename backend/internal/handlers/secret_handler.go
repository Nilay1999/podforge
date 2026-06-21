package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
)

type SecretHandler struct {
	svc services.SecretService
	log *zap.Logger
}

func NewSecretHandler(svc services.SecretService, log *zap.Logger) *SecretHandler {
	return &SecretHandler{svc: svc, log: log}
}

func (h *SecretHandler) Create(c *gin.Context) { handleCreate(c, h.log, h.svc.Create) }
func (h *SecretHandler) Get(c *gin.Context)    { handleGet(c, h.log, h.svc.Get) }
func (h *SecretHandler) List(c *gin.Context)   { handleList(c, h.log, h.svc.List) }
func (h *SecretHandler) Delete(c *gin.Context) { handleDelete(c, h.log, h.svc.Delete) }

func (h *SecretHandler) Update(c *gin.Context) {
	handleUpdate(c, h.log, h.svc.Update, func(req *types.CreateSecretRequest, namespace, name string) {
		req.Namespace = namespace
		req.Name = name
	})
}
