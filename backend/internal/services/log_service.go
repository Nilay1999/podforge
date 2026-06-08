package services

import (
	"context"
	"io"

	corev1 "k8s.io/api/core/v1"
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
	logOpts := &corev1.PodLogOptions{
		Follow:   opts.Follow,
		Previous: opts.Previous,
	}
	if opts.Container != "" {
		logOpts.Container = opts.Container
	}
	if opts.TailLines != nil {
		logOpts.TailLines = opts.TailLines
	}
	return s.clientset.CoreV1().Pods(namespace).GetLogs(pod, logOpts).Stream(ctx)
}
