package services

import (
	"context"
	"fmt"
	"sync"

	"github.com/podforge/backend/internal/types"
	"golang.org/x/sync/errgroup"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type DashboardService interface {
	Summary(ctx context.Context, namespace string) (types.DashboardSummary, error)
	PodPhases(ctx context.Context, namespace string) (types.PodPhaseCounts, error)
	NamespaceOverview(ctx context.Context, namespace string) (types.NamespaceOverview, error)
}

type dashboardService struct {
	clientset *kubernetes.Clientset
}

func NewDashboardService(clientset *kubernetes.Clientset) DashboardService {
	return &dashboardService{clientset: clientset}
}

func (s *dashboardService) Summary(ctx context.Context, namespace string) (types.DashboardSummary, error) {
	var (
		summary types.DashboardSummary
		mu      sync.Mutex
	)

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("pods: %w", err)
		}
		mu.Lock()
		summary.Pods = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("deployments: %w", err)
		}
		mu.Lock()
		summary.Deployments = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("configmaps: %w", err)
		}
		mu.Lock()
		summary.ConfigMaps = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("services: %w", err)
		}
		mu.Lock()
		summary.Services = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("secrets: %w", err)
		}
		mu.Lock()
		summary.Secrets = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("nodes: %w", err)
		}
		mu.Lock()
		summary.Nodes = len(list.Items)
		mu.Unlock()
		return nil
	})

	if err := g.Wait(); err != nil {
		return types.DashboardSummary{}, err
	}

	return summary, nil
}

func (s *dashboardService) PodPhases(ctx context.Context, namespace string) (types.PodPhaseCounts, error) {
	pods, err := s.clientset.CoreV1().Pods(namespace).List(ctx, v1.ListOptions{})
	if err != nil {
		return types.PodPhaseCounts{}, err
	}

	counts := types.PodPhaseCounts{}
	for _, pod := range pods.Items {
		switch pod.Status.Phase {
		case corev1.PodRunning:
			counts.Running++
		case corev1.PodPending:
			counts.Pending++
		case corev1.PodFailed:
			counts.Failed++
		case corev1.PodSucceeded:
			counts.Succeeded++
		default:
			counts.Unknown++
		}
	}
	return counts, nil
}

func (s *dashboardService) NamespaceOverview(ctx context.Context, namespace string) (types.NamespaceOverview, error) {
	var (
		summary types.NamespaceOverview
		mu      sync.Mutex
	)

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("pods: %w", err)
		}
		mu.Lock()
		summary.Pods = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("deployments: %w", err)
		}
		mu.Lock()
		summary.Deployments = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("configmaps: %w", err)
		}
		mu.Lock()
		summary.ConfigMaps = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("services: %w", err)
		}
		mu.Lock()
		summary.Services = len(list.Items)
		mu.Unlock()
		return nil
	})

	g.Go(func() error {
		list, err := s.clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return fmt.Errorf("secrets: %w", err)
		}
		mu.Lock()
		summary.Secrets = len(list.Items)
		mu.Unlock()
		return nil
	})
	summary.Namespace = namespace
	if err := g.Wait(); err != nil {
		return types.NamespaceOverview{}, err
	}

	return summary, nil
}
