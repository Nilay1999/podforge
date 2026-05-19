package services

import (
	"context"
	"fmt"
	"sync"

	"github.com/podforge/backend/internal/types"
	"sigs.k8s.io/yaml"
)

type Deleter interface {
	Delete(ctx context.Context, namespace, name string) error
}

type Applier interface {
	Apply(ctx context.Context, namespace string, data []byte) error
}

type BulkService interface {
	Delete(ctx context.Context, req types.BulkDeleteRequest) types.BulkDeleteResult
	Apply(ctx context.Context, req types.BulkApplyRequest) types.BulkApplyResult
}

type bulkService struct {
	deleters map[string]Deleter
	applier  Applier
}

type channelResult struct {
	target types.BulkTarget
	err    error
}

func NewBulkService(
	kubernetesService KubernetesService,
	deploymentService DeploymentService,
	podService PodService,
	applier Applier,
) BulkService {
	return &bulkService{
		deleters: map[string]Deleter{
			"service":    kubernetesService,
			"deployment": deploymentService,
			"pod":        podService,
		},
		applier: applier,
	}
}

func (s *bulkService) Delete(ctx context.Context, req types.BulkDeleteRequest) types.BulkDeleteResult {
	deleter, ok := s.deleters[req.Kind]
	if !ok {
		return types.BulkDeleteResult{}
	}

	var wg sync.WaitGroup
	resultCh := make(chan channelResult, len(req.Targets))

	for _, item := range req.Targets {
		wg.Add(1)
		go deleteRoutine(ctx, item, &wg, deleter, resultCh)
	}

	wg.Wait()
	close(resultCh)

	result := types.BulkDeleteResult{
		Succeeded: make([]types.BulkTarget, 0, len(req.Targets)),
		Failed:    make([]types.BulkItemResult, 0),
	}
	for r := range resultCh {
		if r.err != nil {
			result.Failed = append(result.Failed, types.BulkItemResult{
				Target: r.target,
				Error:  r.err.Error(),
			})
			continue
		}
		result.Succeeded = append(result.Succeeded, r.target)
	}
	return result
}

func (s *bulkService) Apply(ctx context.Context, req types.BulkApplyRequest) types.BulkApplyResult {
	var wg sync.WaitGroup
	resultCh := make(chan channelResult, len(req.Manifests))

	for _, manifest := range req.Manifests {
		data := []byte(manifest)
		target, err := parseManifestTarget(data)
		if err != nil {
			resultCh <- channelResult{target: target, err: err}
			continue
		}
		wg.Add(1)
		go applyRoutine(ctx, target, data, &wg, s.applier, resultCh)
	}

	wg.Wait()
	close(resultCh)

	result := types.BulkApplyResult{
		Succeeded: make([]types.BulkTarget, 0, len(req.Manifests)),
		Failed:    make([]types.BulkItemResult, 0),
	}
	for r := range resultCh {
		if r.err != nil {
			result.Failed = append(result.Failed, types.BulkItemResult{
				Target: r.target,
				Error:  r.err.Error(),
			})
			continue
		}
		result.Succeeded = append(result.Succeeded, r.target)
	}
	return result
}

func deleteRoutine(ctx context.Context, item types.BulkTarget, wg *sync.WaitGroup, deleter Deleter, resultCh chan<- channelResult) {
	defer wg.Done()
	err := deleter.Delete(ctx, item.Namespace, item.Name)
	resultCh <- channelResult{target: item, err: err}
}

func applyRoutine(ctx context.Context, target types.BulkTarget, data []byte, wg *sync.WaitGroup, applier Applier, resultCh chan<- channelResult) {
	defer wg.Done()
	err := applier.Apply(ctx, target.Namespace, data)
	resultCh <- channelResult{target: target, err: err}
}

func parseManifestTarget(data []byte) (types.BulkTarget, error) {
	var partial struct {
		Metadata struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
		} `json:"metadata"`
	}
	if err := yaml.Unmarshal(data, &partial); err != nil {
		return types.BulkTarget{}, fmt.Errorf("parse manifest metadata: %w", err)
	}
	return types.BulkTarget{Name: partial.Metadata.Name, Namespace: partial.Metadata.Namespace}, nil
}
