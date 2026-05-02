package services

import (
	"context"

	"github.com/nilay/k8s-orchestrator/backend/internal/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type PodService interface {
	Create(ctx context.Context, req types.CreatePodRequest) (*corev1.Pod, error)
	Get(ctx context.Context, namespace, name string) (*corev1.Pod, error)
	List(ctx context.Context, namespace string) (*corev1.PodList, error)
	Update(ctx context.Context, req types.CreatePodRequest) (*corev1.Pod, error)
	Delete(ctx context.Context, namespace, name string) error
}

type podService struct {
	clientset *kubernetes.Clientset
}

func NewPodService(clientset *kubernetes.Clientset) PodService {
	return &podService{clientset: clientset}
}

func (s *podService) Get(ctx context.Context, namespace, name string) (*corev1.Pod, error) {
	return s.clientset.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (s *podService) List(ctx context.Context, namespace string) (*corev1.PodList, error) {
	list, err := s.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.PodList{Items: []corev1.Pod{}}, err
	}
	if list.Items == nil {
		list.Items = []corev1.Pod{}
	}
	return list, nil
}

func (s *podService) Delete(ctx context.Context, namespace, name string) error {
	return s.clientset.CoreV1().Pods(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func (s *podService) Create(ctx context.Context, req types.CreatePodRequest) (*corev1.Pod, error) {
	pod, err := builders.BuildPod(req)
	if err != nil {
		return nil, err
	}
	return s.clientset.CoreV1().Pods(req.Namespace).Create(ctx, pod, metav1.CreateOptions{})
}

func (s *podService) Update(ctx context.Context, req types.CreatePodRequest) (*corev1.Pod, error) {
	existing, err := s.clientset.CoreV1().Pods(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	imageMap := make(map[string]string, len(req.Containers))
	for _, c := range req.Containers {
		if c.Image != "" {
			imageMap[c.Name] = c.Image
		}
	}
	for i, c := range existing.Spec.Containers {
		if img, ok := imageMap[c.Name]; ok {
			existing.Spec.Containers[i].Image = img
		}
	}
	for i, c := range existing.Spec.InitContainers {
		if img, ok := imageMap[c.Name]; ok {
			existing.Spec.InitContainers[i].Image = img
		}
	}

	if req.ActiveDeadlineSeconds != nil {
		existing.Spec.ActiveDeadlineSeconds = req.ActiveDeadlineSeconds
	}
	if req.TerminationGracePeriodSeconds != nil {
		existing.Spec.TerminationGracePeriodSeconds = req.TerminationGracePeriodSeconds
	}
	if len(req.Tolerations) > 0 {
		existing.Spec.Tolerations = append(existing.Spec.Tolerations, builders.BuildTolerations(req.Tolerations)...)
	}

	return s.clientset.CoreV1().Pods(req.Namespace).Update(ctx, existing, metav1.UpdateOptions{})
}
