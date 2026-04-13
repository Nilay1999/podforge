package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func CreateConfigmap(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error) {
	configMap := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
		Immutable:  req.Immutable,
		Data:       req.Data,
		BinaryData: req.BinaryData,
	}

	return clientset.CoreV1().ConfigMaps(req.Namespace).Create(ctx, configMap, metav1.CreateOptions{})
}
