package services

import (
	"context"
	"sync"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
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
	appliers map[string]Applier
}

type channelResult struct {
	target types.BulkTarget
	err    error
}

func NewBulkService(
	kubernetesService KubernetesService,
	deploymentService DeploymentService,
	podService PodService,
) BulkService {
	return &bulkService{
		deleters: map[string]Deleter{
			"service":    kubernetesService,
			"deployment": deploymentService,
			"pod":        podService,
		},
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
	return types.BulkApplyResult{}
}

func deleteRoutine(ctx context.Context, item types.BulkTarget, wg *sync.WaitGroup, deleter Deleter, resultCh chan<- channelResult) {
	defer wg.Done()
	err := deleter.Delete(ctx, item.Namespace, item.Name)
	resultCh <- channelResult{target: item, err: err}
}
