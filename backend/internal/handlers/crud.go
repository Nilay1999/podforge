package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
)

// bindJSON decodes the request body into req, writing a 400 response and
// returning false if the payload is malformed.
func bindJSON(c *gin.Context, req any) bool {
	if err := c.ShouldBindJSON(req); err != nil {
		util.RespondError(c, http.StatusBadRequest, err.Error())
		return false
	}
	return true
}

// respondMutation writes the standard create/update/delete acknowledgement.
func respondMutation(c *gin.Context, status int, name, namespace, action string) {
	c.JSON(status, types.CreateResponse{Name: name, Namespace: namespace, Status: action})
}

// handleCreate binds a request, invokes create, and returns the standard 201 ack.
func handleCreate[Req any, Res metav1.Object](c *gin.Context, log *zap.Logger, create func(context.Context, Req) (Res, error)) {
	var req Req
	if !bindJSON(c, &req) {
		return
	}
	result, err := create(c.Request.Context(), req)
	if err != nil {
		util.CreateErrorResponse(c, log, err)
		return
	}
	respondMutation(c, http.StatusCreated, result.GetName(), result.GetNamespace(), "created")
}

// handleUpdate binds a request, stamps the namespace/name from the path via
// setKey, invokes update, and returns the standard 200 ack.
func handleUpdate[Req any, Res metav1.Object](c *gin.Context, log *zap.Logger, update func(context.Context, Req) (Res, error), setKey func(req *Req, namespace, name string)) {
	var req Req
	if !bindJSON(c, &req) {
		return
	}
	setKey(&req, c.Param("namespace"), c.Param("name"))
	result, err := update(c.Request.Context(), req)
	if err != nil {
		util.CreateErrorResponse(c, log, err)
		return
	}
	respondMutation(c, http.StatusOK, result.GetName(), result.GetNamespace(), "updated")
}

// handleGet fetches a single namespaced resource and returns it as JSON.
func handleGet[Res any](c *gin.Context, log *zap.Logger, get func(ctx context.Context, namespace, name string) (Res, error)) {
	result, err := get(c.Request.Context(), c.Param("namespace"), c.Param("name"))
	if err != nil {
		util.CreateErrorResponse(c, log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// handleList fetches all resources in a namespace and returns them as JSON.
func handleList[Res any](c *gin.Context, log *zap.Logger, list func(ctx context.Context, namespace string) (Res, error)) {
	result, err := list(c.Request.Context(), c.Param("namespace"))
	if err != nil {
		util.CreateErrorResponse(c, log, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// handleDelete removes a namespaced resource and returns the standard 200 ack.
func handleDelete(c *gin.Context, log *zap.Logger, del func(ctx context.Context, namespace, name string) error) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	if err := del(c.Request.Context(), namespace, name); err != nil {
		util.CreateErrorResponse(c, log, err)
		return
	}
	respondMutation(c, http.StatusOK, name, namespace, "deleted")
}
