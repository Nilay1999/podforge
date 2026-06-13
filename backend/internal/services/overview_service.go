package services

import (
	"context"
	"fmt"

	"github.com/podforge/backend/internal/types"
	"golang.org/x/sync/errgroup"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/kubernetes"
)

type OverviewService interface {
	Deployment(ctx context.Context, namespace, name string) (types.DeploymentOverview, error)
	Pod(ctx context.Context, namespace, name string) (types.PodOverview, error)
}

type overviewService struct {
	clientset *kubernetes.Clientset
}

func NewOverviewService(clientset *kubernetes.Clientset) OverviewService {
	return &overviewService{clientset: clientset}
}

func (s *overviewService) Deployment(ctx context.Context, namespace, name string) (types.DeploymentOverview, error) {
	deployment, err := s.clientset.AppsV1().Deployments(namespace).Get(ctx, name, v1.GetOptions{})
	if err != nil {
		return types.DeploymentOverview{}, fmt.Errorf("deployment: %w", err)
	}

	selector, err := v1.LabelSelectorAsSelector(deployment.Spec.Selector)
	if err != nil {
		return types.DeploymentOverview{}, fmt.Errorf("deployment selector: %w", err)
	}
	ownedOpts := v1.ListOptions{LabelSelector: selector.String()}

	overview := types.DeploymentOverview{Deployment: deployment}
	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		replicaSets, err := s.clientset.AppsV1().ReplicaSets(namespace).List(ctx, ownedOpts)
		if err != nil {
			return fmt.Errorf("replicaSets: %w", err)
		}
		overview.ReplicaSets = replicaSets.Items
		return nil
	})

	g.Go(func() error {
		pods, err := s.clientset.CoreV1().Pods(namespace).List(ctx, ownedOpts)
		if err != nil {
			return fmt.Errorf("pods: %w", err)
		}
		overview.Pods = pods.Items
		return nil
	})

	g.Go(func() error {
		events, err := s.clientset.CoreV1().Events(namespace).List(ctx, v1.ListOptions{
			FieldSelector: fields.OneTermEqualSelector("involvedObject.name", name).String(),
		})
		if err != nil {
			return fmt.Errorf("events: %w", err)
		}
		overview.Events = events.Items
		return nil
	})

	if err := g.Wait(); err != nil {
		return types.DeploymentOverview{}, err
	}
	return overview, nil
}

func (s *overviewService) Pod(ctx context.Context, namespace, name string) (types.PodOverview, error) {
	overview := types.PodOverview{}
	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		pod, err := s.clientset.CoreV1().Pods(namespace).Get(ctx, name, v1.GetOptions{})
		if err != nil {
			return fmt.Errorf("pod: %w", err)
		}
		overview.Pod = pod
		return nil
	})

	g.Go(func() error {
		events, err := s.clientset.CoreV1().Events(namespace).List(ctx, v1.ListOptions{
			FieldSelector: fields.OneTermEqualSelector("involvedObject.name", name).String(),
		})
		if err != nil {
			return fmt.Errorf("events: %w", err)
		}
		overview.Events = events.Items
		return nil
	})

	if err := g.Wait(); err != nil {
		return types.PodOverview{}, err
	}
	return overview, nil
}
