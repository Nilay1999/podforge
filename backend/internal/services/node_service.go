package services

import (
	"context"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"

	"github.com/podforge/backend/internal/util"
)

type NodeService interface {
	List(ctx context.Context) (*corev1.NodeList, error)
	Get(ctx context.Context, name string) (*corev1.Node, error)
}

type nodeService struct {
	clientset *kubernetes.Clientset
}

func NewNodeService(clientset *kubernetes.Clientset) NodeService {
	return &nodeService{clientset: clientset}
}

func (s *nodeService) List(ctx context.Context) (*corev1.NodeList, error) {
	list, err := s.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return &corev1.NodeList{Items: []corev1.Node{}}, err
	}
	util.NormalizeList(&list.Items)
	return list, nil
}

func (s *nodeService) Get(ctx context.Context, name string) (*corev1.Node, error) {
	return s.clientset.CoreV1().Nodes().Get(ctx, name, metav1.GetOptions{})
}
