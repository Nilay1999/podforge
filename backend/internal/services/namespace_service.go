package services

import (
	"context"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"

	"github.com/podforge/backend/internal/types"
	"github.com/podforge/backend/internal/util"
)

type NamespaceService interface {
	List(ctx context.Context) (*corev1.NamespaceList, error)
	Create(ctx context.Context, req types.CreateNamespaceRequest) (*corev1.Namespace, error)
	Delete(ctx context.Context, name string) error
}

type namespaceService struct {
	clientset *kubernetes.Clientset
}

func NewNamespaceService(clientset *kubernetes.Clientset) NamespaceService {
	return &namespaceService{clientset: clientset}
}

func (s *namespaceService) List(ctx context.Context) (*corev1.NamespaceList, error) {
	list, err := s.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.NamespaceList{Items: []corev1.Namespace{}}, err
	}
	util.NormalizeList(&list.Items)
	return list, nil
}

func (s *namespaceService) Create(ctx context.Context, req types.CreateNamespaceRequest) (*corev1.Namespace, error) {
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
	}
	return s.clientset.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
}

func (s *namespaceService) Delete(ctx context.Context, name string) error {
	return s.clientset.CoreV1().Namespaces().Delete(ctx, name, metav1.DeleteOptions{})
}
