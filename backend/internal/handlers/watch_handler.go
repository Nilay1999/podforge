package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"k8s.io/apimachinery/pkg/watch"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/util"
)

type WatchHandler struct {
	svc services.WatchService
	log *zap.Logger
}

func NewWatchHandler(svc services.WatchService, log *zap.Logger) *WatchHandler {
	return &WatchHandler{svc: svc, log: log}
}

func (h *WatchHandler) Events(c *gin.Context) {
	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	namespace := c.DefaultQuery("namespace", "")

	watcher, err := h.svc.Events(ctx, namespace)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	defer watcher.Stop()

	setSseHeaders(c)

	c.Stream(func(w io.Writer) bool {
		select {
		case event, ok := <-watcher.ResultChan():
			if !ok {
				return false
			}
			if event.Type == watch.Error {
				h.log.Warn("watch error event received")
				return false
			}
			payload, err := json.Marshal(map[string]interface{}{
				"type":   event.Type,
				"object": event.Object,
			})
			if err != nil {
				h.log.Error("failed to marshal k8s event", zap.Error(err))
				return true
			}
			fmt.Fprintf(w, "event: k8s_event\ndata: %s\n\n", payload)
			return true
		case <-ctx.Done():
			return false
		}
	})
}

func (h *WatchHandler) Resource(c *gin.Context) {
	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	kind := c.Param("kind")
	namespace := c.Param("namespace")

	watcher, err := h.svc.Resource(ctx, kind, namespace)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	defer watcher.Stop()

	setSseHeaders(c)

	eventPrefix := strings.ToLower(strings.TrimSuffix(strings.ToLower(kind), "s"))

	c.Stream(func(w io.Writer) bool {
		select {
		case event, ok := <-watcher.ResultChan():
			if !ok {
				return false
			}
			if event.Type == watch.Error {
				h.log.Warn("watch error event received", zap.String("kind", kind))
				return false
			}
			payload, err := json.Marshal(event.Object)
			if err != nil {
				h.log.Error("failed to marshal resource event", zap.Error(err))
				return true
			}
			eventName := fmt.Sprintf("%s_%s", eventPrefix, strings.ToLower(string(event.Type)))
			fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventName, payload)
			return true
		case <-ctx.Done():
			return false
		}
	})
}

func setSseHeaders(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
}
