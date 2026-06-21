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

type ServiceService interface {
	Create(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error)
	Get(ctx context.Context, namespace, name string) (*corev1.Service, error)
	List(ctx context.Context, namespace string) (*corev1.ServiceList, error)
	Update(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error)
	Delete(ctx context.Context, namespace, name string) error
}

type serviceService struct {
	clientset *kubernetes.Clientset
}

func NewServiceService(clientset *kubernetes.Clientset) ServiceService {
	return &serviceService{clientset: clientset}
}

func (s *serviceService) Get(ctx context.Context, namespace string, name string) (*corev1.Service, error) {
	return s.clientset.CoreV1().Services(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (s *serviceService) List(ctx context.Context, namespace string) (*corev1.ServiceList, error) {
	list, err := s.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.ServiceList{Items: []corev1.Service{}}, err
	}
	util.NormalizeList(&list.Items)
	return list, nil
}

func (s *serviceService) Create(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error) {
	service := builders.BuildService(req)
	return s.clientset.CoreV1().Services(req.Namespace).Create(ctx, service, metav1.CreateOptions{})
}

func (s *serviceService) Update(ctx context.Context, req types.CreateServiceRequest) (*corev1.Service, error) {
	existing, err := s.clientset.CoreV1().Services(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	service := builders.BuildService(req)
	service.ResourceVersion = existing.ResourceVersion
	// ClusterIP is immutable; preserve the one the apiserver allocated.
	if service.Spec.ClusterIP == "" {
		service.Spec.ClusterIP = existing.Spec.ClusterIP
	}

	return s.clientset.CoreV1().Services(req.Namespace).Update(ctx, service, metav1.UpdateOptions{})
}

func (s *serviceService) Delete(ctx context.Context, namespace string, name string) error {
	return s.clientset.CoreV1().Services(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}
