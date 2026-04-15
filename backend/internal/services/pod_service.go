package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/services/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func GetPod(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) (*corev1.Pod, error) {
	return clientset.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
}

func ListPods(ctx context.Context, clientset *kubernetes.Clientset, namespace string) (*corev1.PodList, error) {
	list, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.PodList{
			Items: []corev1.Pod{},
		}, err
	}
	if list.Items == nil {
		list.Items = []corev1.Pod{}
	}
	return list, nil
}

func DeletePod(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) error {
	return clientset.CoreV1().Pods(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func CreatePod(ctx context.Context, clientset *kubernetes.Clientset, req types.CreatePodRequest) (*corev1.Pod, error) {
	pod, err := builders.BuildPod(req)
	if err != nil {
		return nil, err
	}
	return clientset.CoreV1().Pods(req.Namespace).Create(ctx, pod, metav1.CreateOptions{})
}

func UpdatePod(ctx context.Context, clientset *kubernetes.Clientset, req types.CreatePodRequest) (*corev1.Pod, error) {
	existing, err := clientset.CoreV1().Pods(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	pod, err := builders.BuildPod(req)
	if err != nil {
		return nil, err
	}
	pod.ResourceVersion = existing.ResourceVersion

	return clientset.CoreV1().Pods(req.Namespace).Update(ctx, pod, metav1.UpdateOptions{})
}
