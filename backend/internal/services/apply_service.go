package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	yamlutil "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"sigs.k8s.io/yaml"

	"github.com/podforge/backend/internal/types"
)

type ManifestApplier interface {
	Applier
	ApplyManifests(ctx context.Context, namespace string, data []byte, dryRun bool) ([]types.AppliedResource, error)
}

type applyService struct {
	dynamic dynamic.Interface
	mapper  apimeta.RESTMapper
}

func NewApplyService(cfg *rest.Config) (ManifestApplier, error) {
	dynClient, err := dynamic.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("dynamic client: %w", err)
	}
	disco, err := discovery.NewDiscoveryClientForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("discovery client: %w", err)
	}
	mapper := restmapper.NewDeferredDiscoveryRESTMapper(memory.NewMemCacheClient(disco))
	return &applyService{dynamic: dynClient, mapper: mapper}, nil
}

func (s *applyService) Apply(ctx context.Context, namespace string, data []byte) error {
	jsonData, err := yaml.YAMLToJSON(data)
	if err != nil {
		return fmt.Errorf("yaml to json: %w", err)
	}

	obj := &unstructured.Unstructured{}
	if err := json.Unmarshal(jsonData, obj); err != nil {
		return fmt.Errorf("decode manifest: %w", err)
	}

	_, err = s.applyObject(ctx, namespace, obj, false)
	return err
}

func (s *applyService) ApplyManifests(ctx context.Context, namespace string, data []byte, dryRun bool) ([]types.AppliedResource, error) {
	objects, err := decodeManifests(data)
	if err != nil {
		return nil, err
	}
	if len(objects) == 0 {
		return nil, &types.ValidationError{Err: errors.New("no resources found in manifest")}
	}

	applied := make([]types.AppliedResource, 0, len(objects))
	for i, obj := range objects {
		res, err := s.applyObject(ctx, namespace, obj, dryRun)
		if err != nil {
			return applied, fmt.Errorf("document %d (%s/%s): %w", i+1, obj.GetKind(), obj.GetName(), err)
		}
		applied = append(applied, res)
	}
	return applied, nil
}

func (s *applyService) applyObject(ctx context.Context, namespace string, obj *unstructured.Unstructured, dryRun bool) (types.AppliedResource, error) {
	gvk := obj.GroupVersionKind()
	if gvk.Kind == "" {
		return types.AppliedResource{}, &types.ValidationError{Err: errors.New("manifest is missing kind")}
	}
	if obj.GetName() == "" {
		return types.AppliedResource{}, &types.ValidationError{Err: fmt.Errorf("%s manifest is missing metadata.name", gvk.Kind)}
	}

	mapping, err := s.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return types.AppliedResource{}, fmt.Errorf("rest mapping for %s: %w", gvk.Kind, err)
	}

	ns := obj.GetNamespace()
	if ns == "" {
		ns = namespace
	}

	var resource dynamic.ResourceInterface
	if mapping.Scope.Name() == apimeta.RESTScopeNameNamespace {
		resource = s.dynamic.Resource(mapping.Resource).Namespace(ns)
	} else {
		ns = ""
		resource = s.dynamic.Resource(mapping.Resource)
	}

	opts := metav1.ApplyOptions{
		FieldManager: "orchestrator",
		Force:        true,
	}
	if dryRun {
		opts.DryRun = []string{metav1.DryRunAll}
	}

	if _, err := resource.Apply(ctx, obj.GetName(), obj, opts); err != nil {
		return types.AppliedResource{}, err
	}
	return types.AppliedResource{Kind: gvk.Kind, Name: obj.GetName(), Namespace: ns}, nil
}

func decodeManifests(data []byte) ([]*unstructured.Unstructured, error) {
	decoder := yamlutil.NewYAMLOrJSONDecoder(bytes.NewReader(data), 4096)
	var objects []*unstructured.Unstructured
	for i := 0; ; i++ {
		obj := &unstructured.Unstructured{}
		if err := decoder.Decode(obj); err != nil {
			if errors.Is(err, io.EOF) {
				return objects, nil
			}
			return nil, &types.ValidationError{Err: fmt.Errorf("document %d: %w", i+1, err)}
		}
		if len(obj.Object) == 0 {
			continue
		}
		objects = append(objects, obj)
	}
}
