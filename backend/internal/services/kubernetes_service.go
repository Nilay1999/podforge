package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type KubernetesService interface {
	Create(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error)
	Get(ctx context.Context, namespace, name string) (*corev1.Service, error)
	List(ctx context.Context, namespace string) (*corev1.ServiceList, error)
	Update(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error)
	Delete(ctx context.Context, namespace, name string) error
}

type kubernetesService struct {
	clientset *kubernetes.Clientset
}

func NewKubernetesService(clientset *kubernetes.Clientset) KubernetesService {
	return &kubernetesService{clientset: clientset}
}

func (s *kubernetesService) Get(ctx context.Context, namespace string, name string) (*corev1.Service, error) {
	return s.clientset.CoreV1().Services(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (s *kubernetesService) List(ctx context.Context, namespace string) (*corev1.ServiceList, error) {
	list, err := s.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.ServiceList{Items: []corev1.Service{}}, err
	}
	if list.Items == nil {
		list.Items = []corev1.Service{}
	}
	return list, nil
}

func (s *kubernetesService) Create(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error) {
	service := builders.BuildService(req)
	return s.clientset.CoreV1().Services(req.Namespace).Create(ctx, service, metav1.CreateOptions{})
}

func (s *kubernetesService) Update(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error) {
	panic("unimplemented")
}

func (s *kubernetesService) Delete(ctx context.Context, namespace string, name string) error {
	return s.clientset.CoreV1().Services(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}
