package builders

import (
	"fmt"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func BuildPod(req types.CreatePodRequest) (*corev1.Pod, error) {
	containers, err := BuildSidecarContainers(req.Containers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("containers: %w", err)}
	}
	if len(containers) == 0 {
		return nil, &types.ValidationError{Err: fmt.Errorf("at least one container is required")}
	}

	initContainers, err := BuildSidecarContainers(req.InitContainers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("initContainers: %w", err)}
	}

	volumes, err := BuildVolumes(req.Volumes)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	overhead, err := BuildOverhead(req.Overhead)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("overhead: %w", err)}
	}

	podSpec := corev1.PodSpec{
		Containers:                    containers,
		InitContainers:                initContainers,
		Volumes:                       volumes,
		ImagePullSecrets:              BuildImagePullSecrets(req.ImagePullSecrets),
		ServiceAccountName:            req.ServiceAccount,
		AutomountServiceAccountToken:  req.AutomountServiceAccountToken,
		NodeSelector:                  req.NodeSelector,
		NodeName:                      req.NodeName,
		Tolerations:                   BuildTolerations(req.Tolerations),
		Affinity:                      BuildAffinity(req.Affinity),
		TopologySpreadConstraints:     BuildTopologySpreadConstraints(req.TopologySpreadConstraints),
		SecurityContext:               BuildPodSecurityContext(req.SecurityContext),
		TerminationGracePeriodSeconds: req.TerminationGracePeriodSeconds,
		ActiveDeadlineSeconds:         req.ActiveDeadlineSeconds,
		RestartPolicy:                 corev1.RestartPolicy(req.RestartPolicy),
		PriorityClassName:             req.PriorityClassName,
		Priority:                      req.Priority,
		SchedulerName:                 req.SchedulerName,
		DNSPolicy:                     BuildDNSPolicy(req.DNSPolicy),
		DNSConfig:                     BuildDNSConfig(req.DNSConfig),
		HostNetwork:                   req.HostNetwork,
		HostPID:                       req.HostPID,
		HostIPC:                       req.HostIPC,
		Hostname:                      req.Hostname,
		Subdomain:                     req.Subdomain,
		HostAliases:                   BuildHostAliases(req.HostAliases),
		ReadinessGates:                BuildReadinessGates(req.ReadinessGates),
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

	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
		Spec: podSpec,
	}, nil
}

func BuildDNSConfig(c *types.DNSConfig) *corev1.PodDNSConfig {
	if c == nil {
		return nil
	}
	out := &corev1.PodDNSConfig{
		Nameservers: c.Nameservers,
		Searches:    c.Searches,
	}
	for _, o := range c.Options {
		value := o.Value
		out.Options = append(out.Options, corev1.PodDNSConfigOption{
			Name:  o.Name,
			Value: &value,
		})
	}
	return out
}

func BuildHostAliases(aliases []types.HostAlias) []corev1.HostAlias {
	out := make([]corev1.HostAlias, len(aliases))
	for i, a := range aliases {
		out[i] = corev1.HostAlias{
			IP:        a.IP,
			Hostnames: a.Hostnames,
		}
	}
	return out
}

func BuildReadinessGates(gates []types.PodReadinessGate) []corev1.PodReadinessGate {
	out := make([]corev1.PodReadinessGate, len(gates))
	for i, g := range gates {
		out[i] = corev1.PodReadinessGate{
			ConditionType: corev1.PodConditionType(g.ConditionType),
		}
	}
	return out
}

func BuildOverhead(rl *types.ResourceList) (corev1.ResourceList, error) {
	if rl == nil {
		return nil, nil
	}
	return BuildResourceList(rl)
}
