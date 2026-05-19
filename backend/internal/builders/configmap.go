package builders

import (
	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func BuildConfigmap(req types.CreateConfigmapRequest) *corev1.ConfigMap {
	return &corev1.ConfigMap{
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
}
