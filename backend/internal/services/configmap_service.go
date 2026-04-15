package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type ConfigmapService interface {
	Create(ctx context.Context, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error)
	Get(ctx context.Context, namespace, name string) (*corev1.ConfigMap, error)
	List(ctx context.Context, namespace string) (*corev1.ConfigMapList, error)
	Update(ctx context.Context, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error)
	Delete(ctx context.Context, namespace, name string) error
}

type configmapService struct {
	clientset *kubernetes.Clientset
}

func NewConfigmapService(clientset *kubernetes.Clientset) ConfigmapService {
	return &configmapService{clientset: clientset}
}

func (s *configmapService) Get(ctx context.Context, namespace, name string) (*corev1.ConfigMap, error) {
	return s.clientset.CoreV1().ConfigMaps(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (s *configmapService) List(ctx context.Context, namespace string) (*corev1.ConfigMapList, error) {
	list, err := s.clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.ConfigMapList{Items: []corev1.ConfigMap{}}, err
	}
	if list.Items == nil {
		list.Items = []corev1.ConfigMap{}
	}
	return list, nil
}

func (s *configmapService) Delete(ctx context.Context, namespace, name string) error {
	return s.clientset.CoreV1().ConfigMaps(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func (s *configmapService) Create(ctx context.Context, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error) {
	return s.clientset.CoreV1().ConfigMaps(req.Namespace).Create(ctx, builders.BuildConfigmap(req), metav1.CreateOptions{})
}

func (s *configmapService) Update(ctx context.Context, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error) {
	existing, err := s.clientset.CoreV1().ConfigMaps(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	configMap := builders.BuildConfigmap(req)
	configMap.ResourceVersion = existing.ResourceVersion

	return s.clientset.CoreV1().ConfigMaps(req.Namespace).Update(ctx, configMap, metav1.UpdateOptions{})
}
