package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"k8s.io/client-go/kubernetes"

	k8s "github.com/nilay/k8s-orchestrator/backend/internal/services"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	"github.com/nilay/k8s-orchestrator/backend/internal/util"
)

type PodHandler struct {
	clientset *kubernetes.Clientset
}

func NewPodHandler(clientset *kubernetes.Clientset) *PodHandler {
	return &PodHandler{clientset: clientset}
}

func (h *PodHandler) Create(c *gin.Context) {
	var req types.CreatePodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := k8s.CreatePod(c.Request.Context(), h.clientset, req)
	if err != nil {
		util.CreateErrorResponse(c, err)
		return
	}

	c.JSON(http.StatusCreated, types.CreateResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "created",
	})
}

func (h *PodHandler) Get(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	result, err := k8s.GetPod(c.Request.Context(), h.clientset, namespace, name)
	if err != nil {
		util.CreateErrorResponse(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *PodHandler) List(c *gin.Context) {
	namespace := c.Param("namespace")

	result, err := k8s.ListPods(c.Request.Context(), h.clientset, namespace)
	if err != nil {
		util.CreateErrorResponse(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *PodHandler) Update(c *gin.Context) {
	var req types.CreatePodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.Namespace = c.Param("namespace")
	req.Name = c.Param("name")

	result, err := k8s.UpdatePod(c.Request.Context(), h.clientset, req)
	if err != nil {
		util.CreateErrorResponse(c, err)
		return
	}

	c.JSON(http.StatusOK, types.CreateResponse{
		Name:      result.Name,
		Namespace: result.Namespace,
		Status:    "updated",
	})
}

func (h *PodHandler) Delete(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if err := k8s.DeletePod(c.Request.Context(), h.clientset, namespace, name); err != nil {
		util.CreateErrorResponse(c, err)
		return
	}

	c.JSON(http.StatusOK, types.CreateResponse{
		Name:      name,
		Namespace: namespace,
		Status:    "deleted",
	})
}
