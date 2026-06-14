package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
)

type DeploymentHandler struct {
	svc services.DeploymentService
	log *zap.Logger
}

func NewDeploymentHandler(svc services.DeploymentService, log *zap.Logger) *DeploymentHandler {
	return &DeploymentHandler{svc: svc, log: log}
}

func (h *DeploymentHandler) Create(c *gin.Context) { handleCreate(c, h.log, h.svc.Create) }
func (h *DeploymentHandler) List(c *gin.Context)   { handleList(c, h.log, h.svc.List) }
func (h *DeploymentHandler) Delete(c *gin.Context) { handleDelete(c, h.log, h.svc.Delete) }

func (h *DeploymentHandler) Update(c *gin.Context) {
	handleUpdate(c, h.log, h.svc.Update, func(req *types.CreateDeploymentRequest, namespace, name string) {
		req.Namespace = namespace
		req.Name = name
	})
}

func (h *DeploymentHandler) Get(c *gin.Context) {
	req := types.GetDeploymentByName{
		Namespace: c.Param("namespace"),
		Name:      c.Param("name"),
	}

	result, err := h.svc.Get(c.Request.Context(), req)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *DeploymentHandler) Scale(c *gin.Context) {
	var req struct {
		Replicas int32 `json:"replicas" binding:"min=0"`
	}
	if !bindJSON(c, &req) {
		return
	}
	result, err := h.svc.Scale(c.Request.Context(), c.Param("namespace"), c.Param("name"), req.Replicas)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	respondMutation(c, http.StatusOK, result.Name, result.Namespace, "scaled")
}

func (h *DeploymentHandler) Restart(c *gin.Context) {
	result, err := h.svc.Restart(c.Request.Context(), c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	respondMutation(c, http.StatusOK, result.Name, result.Namespace, "restarted")
}
