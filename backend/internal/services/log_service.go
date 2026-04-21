package services

import (
	"context"
	"io"

	"k8s.io/client-go/kubernetes"
)

type LogStreamOptions struct {
	Container string
	Follow    bool
	TailLines *int64
	Previous  bool
}

type LogService interface {
	Stream(ctx context.Context, namespace, pod string, opts LogStreamOptions) (io.ReadCloser, error)
}

type logService struct {
	clientset *kubernetes.Clientset
}

func NewLogService(clientset *kubernetes.Clientset) LogService {
	return &logService{clientset: clientset}
}

func (s *logService) Stream(ctx context.Context, namespace, pod string, opts LogStreamOptions) (io.ReadCloser, error) {
	return nil, nil
}
