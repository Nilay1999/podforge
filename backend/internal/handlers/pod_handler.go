package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
)

type PodHandler struct {
	svc services.PodService
	log *zap.Logger
}

func NewPodHandler(svc services.PodService, log *zap.Logger) *PodHandler {
	return &PodHandler{svc: svc, log: log}
}

func (h *PodHandler) Create(c *gin.Context) { handleCreate(c, h.log, h.svc.Create) }
func (h *PodHandler) Get(c *gin.Context)    { handleGet(c, h.log, h.svc.Get) }
func (h *PodHandler) List(c *gin.Context)   { handleList(c, h.log, h.svc.List) }
func (h *PodHandler) Delete(c *gin.Context) { handleDelete(c, h.log, h.svc.Delete) }

func (h *PodHandler) Update(c *gin.Context) {
	handleUpdate(c, h.log, h.svc.Update, func(req *types.CreatePodRequest, namespace, name string) {
		req.Namespace = namespace
		req.Name = name
	})
}
