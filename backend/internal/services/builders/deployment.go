package builders

import (
	"fmt"

	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

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
