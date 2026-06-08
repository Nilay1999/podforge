package services

import (
	"context"
	"time"

	"github.com/podforge/backend/internal/builders"
	"github.com/podforge/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type DeploymentService interface {
	Create(ctx context.Context, req types.CreateDeploymentRequest) (*appsv1.Deployment, error)
	Get(ctx context.Context, req types.GetDeploymentByName) (*appsv1.Deployment, error)
	List(ctx context.Context, namespace string) (*appsv1.DeploymentList, error)
	Update(ctx context.Context, req types.CreateDeploymentRequest) (*appsv1.Deployment, error)
	Delete(ctx context.Context, namespace, name string) error
	Scale(ctx context.Context, namespace, name string, replicas int32) (*appsv1.Deployment, error)
	Restart(ctx context.Context, namespace, name string) (*appsv1.Deployment, error)
}

type deploymentService struct {
	clientset *kubernetes.Clientset
}

func NewDeploymentService(clientset *kubernetes.Clientset) DeploymentService {
	return &deploymentService{clientset: clientset}
}

func (s *deploymentService) Get(ctx context.Context, req types.GetDeploymentByName) (*appsv1.Deployment, error) {
	return s.clientset.AppsV1().Deployments(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
}

func (s *deploymentService) List(ctx context.Context, namespace string) (*appsv1.DeploymentList, error) {
	list, err := s.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &appsv1.DeploymentList{Items: []appsv1.Deployment{}}, err
	}
	if list.Items == nil {
		list.Items = []appsv1.Deployment{}
	}
	return list, nil
}

func (s *deploymentService) Delete(ctx context.Context, namespace, name string) error {
	return s.clientset.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func (s *deploymentService) Create(ctx context.Context, req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	deployment, err := builders.BuildDeployment(req)
	if err != nil {
		return nil, err
	}
	return s.clientset.AppsV1().Deployments(req.Namespace).Create(ctx, deployment, metav1.CreateOptions{})
}

func (s *deploymentService) Scale(ctx context.Context, namespace, name string, replicas int32) (*appsv1.Deployment, error) {
	scale, err := s.clientset.AppsV1().Deployments(namespace).GetScale(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	scale.Spec.Replicas = replicas
	if _, err = s.clientset.AppsV1().Deployments(namespace).UpdateScale(ctx, name, scale, metav1.UpdateOptions{}); err != nil {
		return nil, err
	}
	return s.clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (s *deploymentService) Restart(ctx context.Context, namespace, name string) (*appsv1.Deployment, error) {
	deployment, err := s.clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	if deployment.Spec.Template.Annotations == nil {
		deployment.Spec.Template.Annotations = map[string]string{}
	}
	deployment.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().UTC().Format(time.RFC3339)
	return s.clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
}

func (s *deploymentService) Update(ctx context.Context, req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	existing, err := s.clientset.AppsV1().Deployments(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	deployment, err := builders.BuildDeployment(req)
	if err != nil {
		return nil, err
	}
	deployment.ResourceVersion = existing.ResourceVersion

	return s.clientset.AppsV1().Deployments(req.Namespace).Update(ctx, deployment, metav1.UpdateOptions{})
}
