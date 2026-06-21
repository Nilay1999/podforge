package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
)

type ConfigmapHandler struct {
	svc services.ConfigmapService
	log *zap.Logger
}

func NewConfigMapHandler(svc services.ConfigmapService, log *zap.Logger) *ConfigmapHandler {
	return &ConfigmapHandler{svc: svc, log: log}
}

func (h *ConfigmapHandler) Create(c *gin.Context) { handleCreate(c, h.log, h.svc.Create) }
func (h *ConfigmapHandler) Get(c *gin.Context)    { handleGet(c, h.log, h.svc.Get) }
func (h *ConfigmapHandler) List(c *gin.Context)   { handleList(c, h.log, h.svc.List) }
func (h *ConfigmapHandler) Delete(c *gin.Context) { handleDelete(c, h.log, h.svc.Delete) }

func (h *ConfigmapHandler) Update(c *gin.Context) {
	handleUpdate(c, h.log, h.svc.Update, func(req *types.CreateConfigmapRequest, namespace, name string) {
		req.Namespace = namespace
		req.Name = name
	})
}
