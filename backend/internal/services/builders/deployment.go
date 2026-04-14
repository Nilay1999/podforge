package builders

import (
	"fmt"
	"maps"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

func BuildDeployment(req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	replicas := req.Replicas
	labels := map[string]string{"app": req.Name}
	maps.Copy(labels, req.Labels)

	mainContainer, err := BuildMainContainer(req)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	sidecars, err := BuildSidecarContainers(req.Sidecars)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("sidecars: %w", err)}
	}

	initContainers, err := BuildSidecarContainers(req.InitContainers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("initContainers: %w", err)}
	}

	volumes, err := BuildVolumes(req.Volumes)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	podSpec := corev1.PodSpec{
		Containers:                    append([]corev1.Container{mainContainer}, sidecars...),
		InitContainers:                initContainers,
		Volumes:                       volumes,
		ImagePullSecrets:              BuildImagePullSecrets(req.ImagePullSecrets),
		ServiceAccountName:            req.ServiceAccount,
		NodeSelector:                  req.NodeSelector,
		NodeName:                      req.NodeName,
		Tolerations:                   BuildTolerations(req.Tolerations),
		Affinity:                      BuildAffinity(req.Affinity),
		TopologySpreadConstraints:     BuildTopologySpreadConstraints(req.TopologySpreadConstraints),
		SecurityContext:               BuildPodSecurityContext(req.PodSecurityContext),
		TerminationGracePeriodSeconds: req.TerminationGracePeriodSeconds,
		PriorityClassName:             req.PriorityClassName,
		DNSPolicy:                     BuildDNSPolicy(req.DNSPolicy),
	}
	if req.RuntimeClassName != "" {
		podSpec.RuntimeClassName = &req.RuntimeClassName
	}

	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      labels,
			Annotations: req.Annotations,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas:                &replicas,
			Strategy:                BuildStrategy(req.Strategy),
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
	}, nil
}

func BuildMainContainer(req types.CreateDeploymentRequest) (corev1.Container, error) {
	resources, err := BuildResources(req.Resources)
	if err != nil {
		return corev1.Container{}, err
	}
	livenessProbe, err := BuildProbe(req.LivenessProbe)
	if err != nil {
		return corev1.Container{}, fmt.Errorf("livenessProbe: %w", err)
	}
	readinessProbe, err := BuildProbe(req.ReadinessProbe)
	if err != nil {
		return corev1.Container{}, fmt.Errorf("readinessProbe: %w", err)
	}
	startupProbe, err := BuildProbe(req.StartupProbe)
	if err != nil {
		return corev1.Container{}, fmt.Errorf("startupProbe: %w", err)
	}
	return corev1.Container{
		Name:            req.Name,
		Image:           req.Image,
		Command:         req.Command,
		Args:            req.Args,
		WorkingDir:      req.WorkingDir,
		Ports:           BuildContainerPorts(req.Ports),
		Env:             BuildEnvVars(req.EnvVars),
		EnvFrom:         BuildEnvFrom(req.EnvFrom),
		ImagePullPolicy: BuildImagePullPolicy(req.ImagePullPolicy),
		Resources:       resources,
		VolumeMounts:    BuildVolumeMounts(req.VolumeMounts),
		LivenessProbe:   livenessProbe,
		ReadinessProbe:  readinessProbe,
		StartupProbe:    startupProbe,
		Lifecycle:       BuildLifecycle(req.Lifecycle),
		SecurityContext: BuildContainerSecurityContext(req.ContainerSecurityContext),
	}, nil
}

func BuildStrategy(s *types.DeploymentStrategy) appsv1.DeploymentStrategy {
	if s == nil {
		return appsv1.DeploymentStrategy{Type: appsv1.RollingUpdateDeploymentStrategyType}
	}
	if s.Type == "Recreate" {
		return appsv1.DeploymentStrategy{Type: appsv1.RecreateDeploymentStrategyType}
	}
	ru := &appsv1.RollingUpdateDeployment{}
	if s.MaxSurge != "" {
		val := intstr.Parse(s.MaxSurge)
		ru.MaxSurge = &val
	}
	if s.MaxUnavailable != "" {
		val := intstr.Parse(s.MaxUnavailable)
		ru.MaxUnavailable = &val
	}
	return appsv1.DeploymentStrategy{
		Type:          appsv1.RollingUpdateDeploymentStrategyType,
		RollingUpdate: ru,
	}
}
