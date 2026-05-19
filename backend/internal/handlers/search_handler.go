package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/util"
)

type SearchHandler struct {
	svc services.SearchService
	log *zap.Logger
}

func NewSearchHandler(svc services.SearchService, log *zap.Logger) *SearchHandler {
	return &SearchHandler{svc: svc, log: log}
}

func (h *SearchHandler) Search(c *gin.Context) {
	result, err := h.svc.Search(c.Request.Context(), c.Query("q"), c.Query("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}
