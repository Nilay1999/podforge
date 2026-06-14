package services

import (
	"context"

	"github.com/podforge/backend/internal/builders"
	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type SecretService interface {
	Create(ctx context.Context, req types.CreateSecretRequest) (*corev1.Secret, error)
	Get(ctx context.Context, namespace, name string) (*corev1.Secret, error)
	List(ctx context.Context, namespace string) (*corev1.SecretList, error)
	Update(ctx context.Context, req types.CreateSecretRequest) (*corev1.Secret, error)
	Delete(ctx context.Context, namespace, name string) error
}

type secretService struct {
	clientset *kubernetes.Clientset
}

func NewSecretService(clientset *kubernetes.Clientset) SecretService {
	return &secretService{clientset: clientset}
}

const redactedValue = "[REDACTED]"

// redactSecret masks Data values so secret contents never leave the server.
// Keys are preserved so callers can still see which entries exist.
func redactSecret(secret *corev1.Secret) {
	for k := range secret.Data {
		secret.Data[k] = []byte(redactedValue)
	}
}

func (s *secretService) Get(ctx context.Context, namespace, name string) (*corev1.Secret, error) {
	secret, err := s.clientset.CoreV1().Secrets(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	redactSecret(secret)
	return secret, nil
}

func (s *secretService) List(ctx context.Context, namespace string) (*corev1.SecretList, error) {
	list, err := s.clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.SecretList{Items: []corev1.Secret{}}, err
	}
	util.NormalizeList(&list.Items)
	for i := range list.Items {
		redactSecret(&list.Items[i])
	}
	return list, nil
}

func (s *secretService) Delete(ctx context.Context, namespace, name string) error {
	return s.clientset.CoreV1().Secrets(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func (s *secretService) Create(ctx context.Context, req types.CreateSecretRequest) (*corev1.Secret, error) {
	return s.clientset.CoreV1().Secrets(req.Namespace).Create(ctx, builders.BuildSecret(req), metav1.CreateOptions{})
}

func (s *secretService) Update(ctx context.Context, req types.CreateSecretRequest) (*corev1.Secret, error) {
	existing, err := s.clientset.CoreV1().Secrets(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	secret := builders.BuildSecret(req)
	secret.ResourceVersion = existing.ResourceVersion

	return s.clientset.CoreV1().Secrets(req.Namespace).Update(ctx, secret, metav1.UpdateOptions{})
}
