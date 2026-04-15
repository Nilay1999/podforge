package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/services/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func GetConfigmap(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) (*corev1.ConfigMap, error) {
	return clientset.CoreV1().ConfigMaps(namespace).Get(ctx, name, metav1.GetOptions{})
}

func ListConfigmaps(ctx context.Context, clientset *kubernetes.Clientset, namespace string) (*corev1.ConfigMapList, error) {
	list, err := clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.ConfigMapList{
			Items: []corev1.ConfigMap{},
		}, err
	}
	if list.Items == nil {
		list.Items = []corev1.ConfigMap{}
	}
	return list, nil
}

func DeleteConfigmap(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) error {
	return clientset.CoreV1().ConfigMaps(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func CreateConfigmap(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error) {
	return clientset.CoreV1().ConfigMaps(req.Namespace).Create(ctx, builders.BuildConfigmap(req), metav1.CreateOptions{})
}

func UpdateConfigmap(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateConfigmapRequest) (*corev1.ConfigMap, error) {
	existing, err := clientset.CoreV1().ConfigMaps(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	configMap := builders.BuildConfigmap(req)
	configMap.ResourceVersion = existing.ResourceVersion

	return clientset.CoreV1().ConfigMaps(req.Namespace).Update(ctx, configMap, metav1.UpdateOptions{})
}
