package builders

import (
	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func BuildSecret(req types.CreateSecretRequest) *corev1.Secret {
	secretType := corev1.SecretType(req.Type)
	if secretType == "" {
		secretType = corev1.SecretTypeOpaque
	}

	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
		Type:       secretType,
		StringData: req.StringData,
		Data:       req.Data,
		Immutable:  req.Immutable,
	}
}
