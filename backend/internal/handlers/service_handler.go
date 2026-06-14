package handlers

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
)

type ServiceHandler struct {
	svc services.ServiceService
	log *zap.Logger
}

func NewServiceHandler(svc services.ServiceService, log *zap.Logger) *ServiceHandler {
	return &ServiceHandler{svc: svc, log: log}
}

func (h *ServiceHandler) Create(c *gin.Context) { handleCreate(c, h.log, h.svc.Create) }
func (h *ServiceHandler) Get(c *gin.Context)    { handleGet(c, h.log, h.svc.Get) }
func (h *ServiceHandler) List(c *gin.Context)   { handleList(c, h.log, h.svc.List) }
func (h *ServiceHandler) Delete(c *gin.Context) { handleDelete(c, h.log, h.svc.Delete) }

func (h *ServiceHandler) Update(c *gin.Context) {
	handleUpdate(c, h.log, h.svc.Update, func(req *types.CreateServiceRequest, namespace, name string) {
		req.Namespace = namespace
		req.Name = name
	})
}
