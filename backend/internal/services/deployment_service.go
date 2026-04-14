package services

import (
	"context"
	"fmt"
	"maps"

	"github.com/nilay/k8s-orchestrator/backend/internal/services/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func CreateDeployment(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	replicas := req.Replicas
	labels := map[string]string{"app": req.Name}
	maps.Copy(labels, req.Labels)

	mainContainer, err := builders.BuildMainContainer(req)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	sidecars, err := builders.BuildSidecarContainers(req.Sidecars)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("sidecars: %w", err)}
	}

	initContainers, err := builders.BuildSidecarContainers(req.InitContainers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("initContainers: %w", err)}
	}

	volumes, err := builders.BuildVolumes(req.Volumes)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	podSpec := corev1.PodSpec{
		Containers:                    append([]corev1.Container{mainContainer}, sidecars...),
		InitContainers:                initContainers,
		Volumes:                       volumes,
		ImagePullSecrets:              builders.BuildImagePullSecrets(req.ImagePullSecrets),
		ServiceAccountName:            req.ServiceAccount,
		NodeSelector:                  req.NodeSelector,
		NodeName:                      req.NodeName,
		Tolerations:                   builders.BuildTolerations(req.Tolerations),
		Affinity:                      builders.BuildAffinity(req.Affinity),
		TopologySpreadConstraints:     builders.BuildTopologySpreadConstraints(req.TopologySpreadConstraints),
		SecurityContext:               builders.BuildPodSecurityContext(req.PodSecurityContext),
		TerminationGracePeriodSeconds: req.TerminationGracePeriodSeconds,
		PriorityClassName:             req.PriorityClassName,
		DNSPolicy:                     builders.BuildDNSPolicy(req.DNSPolicy),
	}
	if req.RuntimeClassName != "" {
		podSpec.RuntimeClassName = &req.RuntimeClassName
	}

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      labels,
			Annotations: req.Annotations,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas:                &replicas,
			Strategy:                builders.BuildStrategy(req.Strategy),
			MinReadySeconds:         req.MinReadySeconds,
			RevisionHistoryLimit:    req.RevisionHistoryLimit,
			ProgressDeadlineSeconds: req.ProgressDeadlineSeconds,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": req.Name},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels:      labels,
					Annotations: req.Annotations,
				},
				Spec: podSpec,
			},
		},
	}

	return clientset.AppsV1().Deployments(req.Namespace).Create(ctx, deployment, metav1.CreateOptions{})
}
