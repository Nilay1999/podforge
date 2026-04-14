package services

import (
	"context"
	"fmt"

	"github.com/nilay/k8s-orchestrator/backend/internal/services/builders"
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func CreatePod(ctx context.Context, clientset *kubernetes.Clientset, req types.CreatePodRequest) (*corev1.Pod, error) {
	containers, err := builders.BuildSidecarContainers(req.Containers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("containers: %w", err)}
	}
	if len(containers) == 0 {
		return nil, &types.ValidationError{Err: fmt.Errorf("at least one container is required")}
	}

	initContainers, err := builders.BuildSidecarContainers(req.InitContainers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("initContainers: %w", err)}
	}

	volumes, err := builders.BuildVolumes(req.Volumes)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	overhead, err := builders.BuildOverhead(req.Overhead)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("overhead: %w", err)}
	}

	podSpec := corev1.PodSpec{
		Containers:                    containers,
		InitContainers:                initContainers,
		Volumes:                       volumes,
		ImagePullSecrets:              builders.BuildImagePullSecrets(req.ImagePullSecrets),
		ServiceAccountName:            req.ServiceAccount,
		AutomountServiceAccountToken:  req.AutomountServiceAccountToken,
		NodeSelector:                  req.NodeSelector,
		NodeName:                      req.NodeName,
		Tolerations:                   builders.BuildTolerations(req.Tolerations),
		Affinity:                      builders.BuildAffinity(req.Affinity),
		TopologySpreadConstraints:     builders.BuildTopologySpreadConstraints(req.TopologySpreadConstraints),
		SecurityContext:               builders.BuildPodSecurityContext(req.SecurityContext),
		TerminationGracePeriodSeconds: req.TerminationGracePeriodSeconds,
		ActiveDeadlineSeconds:         req.ActiveDeadlineSeconds,
		RestartPolicy:                 corev1.RestartPolicy(req.RestartPolicy),
		PriorityClassName:             req.PriorityClassName,
		Priority:                      req.Priority,
		SchedulerName:                 req.SchedulerName,
		DNSPolicy:                     builders.BuildDNSPolicy(req.DNSPolicy),
		DNSConfig:                     builders.BuildDNSConfig(req.DNSConfig),
		HostNetwork:                   req.HostNetwork,
		HostPID:                       req.HostPID,
		HostIPC:                       req.HostIPC,
		Hostname:                      req.Hostname,
		Subdomain:                     req.Subdomain,
		HostAliases:                   builders.BuildHostAliases(req.HostAliases),
		ReadinessGates:                builders.BuildReadinessGates(req.ReadinessGates),
		Overhead:                      overhead,
		EnableServiceLinks:            req.EnableServiceLinks,
	}
	if req.RuntimeClassName != "" {
		podSpec.RuntimeClassName = &req.RuntimeClassName
	}
	if req.PreemptionPolicy != "" {
		pp := corev1.PreemptionPolicy(req.PreemptionPolicy)
		podSpec.PreemptionPolicy = &pp
	}

	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
		Spec: podSpec,
	}

	return clientset.CoreV1().Pods(req.Namespace).Create(ctx, pod, metav1.CreateOptions{})
}
