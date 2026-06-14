package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
)

type ApplyHandler struct {
	svc services.ManifestApplier
	log *zap.Logger
}

func NewApplyHandler(svc services.ManifestApplier, log *zap.Logger) *ApplyHandler {
	return &ApplyHandler{svc: svc, log: log}
}

func (h *ApplyHandler) Apply(c *gin.Context) {
	var req types.ApplyRequest
	if !bindJSON(c, &req) {
		return
	}

	namespace := req.Namespace
	if namespace == "" {
		namespace = "default"
	}

	applied, err := h.svc.ApplyManifests(c.Request.Context(), namespace, []byte(req.YAML), req.DryRun)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}

	c.JSON(http.StatusOK, types.ApplyResult{DryRun: req.DryRun, Applied: applied})
}
