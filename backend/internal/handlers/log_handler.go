package handlers

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/services"
	"github.com/podforge/backend/internal/util"
)

type LogHandler struct {
	svc services.LogService
	log *zap.Logger
}

func NewLogHandler(svc services.LogService, log *zap.Logger) *LogHandler {
	return &LogHandler{svc: svc, log: log}
}

func (h *LogHandler) Stream(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	var tailLines *int64
	if t := c.Query("tail"); t != "" {
		n, err := strconv.ParseInt(t, 10, 64)
		if err == nil {
			tailLines = &n
		}
	}

	opts := services.LogStreamOptions{
		Container: c.Query("container"),
		Follow:    c.DefaultQuery("follow", "false") == "true",
		TailLines: tailLines,
		Previous:  c.DefaultQuery("previous", "false") == "true",
	}

	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	stream, err := h.svc.Stream(ctx, namespace, name, opts)
	if err != nil {
		util.CreateErrorResponse(c, h.log, err)
		return
	}
	defer stream.Close()

	setSseHeaders(c)

	scanner := bufio.NewScanner(stream)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)

	c.Stream(func(w io.Writer) bool {
		if !scanner.Scan() {
			return false
		}
		fmt.Fprintf(w, "event: log\ndata: %s\n\n", scanner.Text())
		return true
	})
}
