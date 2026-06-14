package services

import (
	"context"
	"fmt"

	"github.com/podforge/backend/internal/types"
	"golang.org/x/sync/errgroup"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

// resourceCounter pairs a namespaced count query with the field it populates.
// assign is only called once its goroutine finishes, and each writes a distinct
// field, so the results need no mutex — errgroup.Wait provides the barrier.
type resourceCounter struct {
	count  func(ctx context.Context) (int, error)
	assign func(n int)
}

func runCounters(ctx context.Context, counters []resourceCounter) error {
	g, ctx := errgroup.WithContext(ctx)
	for _, rc := range counters {
		g.Go(func() error {
			n, err := rc.count(ctx)
			if err != nil {
				return err
			}
			rc.assign(n)
			return nil
		})
	}
	return g.Wait()
}

func (s *dashboardService) podCount(namespace string) func(context.Context) (int, error) {
	return func(ctx context.Context) (int, error) {
		list, err := s.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return 0, fmt.Errorf("pods: %w", err)
		}
		return len(list.Items), nil
	}
}

func (s *dashboardService) deploymentCount(namespace string) func(context.Context) (int, error) {
	return func(ctx context.Context) (int, error) {
		list, err := s.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return 0, fmt.Errorf("deployments: %w", err)
		}
		return len(list.Items), nil
	}
}

func (s *dashboardService) configMapCount(namespace string) func(context.Context) (int, error) {
	return func(ctx context.Context) (int, error) {
		list, err := s.clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return 0, fmt.Errorf("configmaps: %w", err)
		}
		return len(list.Items), nil
	}
}

func (s *dashboardService) serviceCount(namespace string) func(context.Context) (int, error) {
	return func(ctx context.Context) (int, error) {
		list, err := s.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return 0, fmt.Errorf("services: %w", err)
		}
		return len(list.Items), nil
	}
}

func (s *dashboardService) secretCount(namespace string) func(context.Context) (int, error) {
	return func(ctx context.Context) (int, error) {
		list, err := s.clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return 0, fmt.Errorf("secrets: %w", err)
		}
		return len(list.Items), nil
	}
}

func (s *dashboardService) nodeCount() func(context.Context) (int, error) {
	return func(ctx context.Context) (int, error) {
		list, err := s.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
		if err != nil {
			return 0, fmt.Errorf("nodes: %w", err)
		}
		return len(list.Items), nil
	}
}

func (s *dashboardService) Summary(ctx context.Context, namespace string) (types.DashboardSummary, error) {
	var summary types.DashboardSummary
	counters := []resourceCounter{
		{s.podCount(namespace), func(n int) { summary.Pods = n }},
		{s.deploymentCount(namespace), func(n int) { summary.Deployments = n }},
		{s.configMapCount(namespace), func(n int) { summary.ConfigMaps = n }},
		{s.serviceCount(namespace), func(n int) { summary.Services = n }},
		{s.secretCount(namespace), func(n int) { summary.Secrets = n }},
		{s.nodeCount(), func(n int) { summary.Nodes = n }},
	}
	if err := runCounters(ctx, counters); err != nil {
		return types.DashboardSummary{}, err
	}
	return summary, nil
}

func (s *dashboardService) PodPhases(ctx context.Context, namespace string) (types.PodPhaseCounts, error) {
	pods, err := s.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
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
	summary := types.NamespaceOverview{Namespace: namespace}
	counters := []resourceCounter{
		{s.podCount(namespace), func(n int) { summary.Pods = n }},
		{s.deploymentCount(namespace), func(n int) { summary.Deployments = n }},
		{s.configMapCount(namespace), func(n int) { summary.ConfigMaps = n }},
		{s.serviceCount(namespace), func(n int) { summary.Services = n }},
		{s.secretCount(namespace), func(n int) { summary.Secrets = n }},
	}
	if err := runCounters(ctx, counters); err != nil {
		return types.NamespaceOverview{}, err
	}
	return summary, nil
}
