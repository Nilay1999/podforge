package services

import (
	"context"
	"encoding/json"
	"fmt"

	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"sigs.k8s.io/yaml"
)

type applyService struct {
	dynamic dynamic.Interface
	mapper  apimeta.RESTMapper
}

func NewApplyService(cfg *rest.Config) (Applier, error) {
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

	gvk := obj.GroupVersionKind()
	mapping, err := s.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return fmt.Errorf("rest mapping for %s: %w", gvk.Kind, err)
	}

	ns := obj.GetNamespace()
	if ns == "" {
		ns = namespace
	}

	var resource dynamic.ResourceInterface
	if mapping.Scope.Name() == apimeta.RESTScopeNameNamespace {
		resource = s.dynamic.Resource(mapping.Resource).Namespace(ns)
	} else {
		resource = s.dynamic.Resource(mapping.Resource)
	}

	_, err = resource.Apply(ctx, obj.GetName(), obj, metav1.ApplyOptions{
		FieldManager: "orchestrator",
		Force:        true,
	})
	return err
}
