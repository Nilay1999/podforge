package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/services/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func GetDeployementByName(ctx context.Context, clientset *kubernetes.Clientset, req types.GetDeployementByName) (*appsv1.Deployment, error) {
	return clientset.AppsV1().Deployments(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
}

func ListDeployments(ctx context.Context, clientset *kubernetes.Clientset, namespace string) (*appsv1.DeploymentList, error) {
	list, err := clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &appsv1.DeploymentList{
			Items: []appsv1.Deployment{},
		}, err
	}
	if list.Items == nil {
		list.Items = []appsv1.Deployment{}
	}
	return list, nil
}

func DeleteDeployment(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) error {
	return clientset.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func CreateDeployment(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	deployment, err := builders.BuildDeployment(req)
	if err != nil {
		return nil, err
	}
	return clientset.AppsV1().Deployments(req.Namespace).Create(ctx, deployment, metav1.CreateOptions{})
}

func UpdateDeployment(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	existing, err := clientset.AppsV1().Deployments(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	deployment, err := builders.BuildDeployment(req)
	if err != nil {
		return nil, err
	}
	deployment.ResourceVersion = existing.ResourceVersion

	return clientset.AppsV1().Deployments(req.Namespace).Update(ctx, deployment, metav1.UpdateOptions{})
}
