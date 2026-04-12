package services

import (
	"context"
	"maps"

	"github.com/nilay/incubator/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
)

func CreateDeployment(ctx context.Context, clientset *kubernetes.Clientset, req types.CreateDeploymentRequest) (*appsv1.Deployment, error) {
	replicas := req.Replicas
	labels := map[string]string{"app": req.Name}
	maps.Copy(labels, req.Labels)

	container := corev1.Container{
		Name:           req.Name,
		Image:          req.Image,
		Command:        req.Command,
		Args:           req.Args,
		Ports:          buildPorts(req.Ports),
		Env:            buildEnvVars(req.EnvVars),
		EnvFrom:        buildEnvFrom(req.EnvFrom),
		Resources:      buildResources(req.Resources),
		LivenessProbe:  buildProbe(req.LivenessProbe),
		ReadinessProbe: buildProbe(req.ReadinessProbe),
	}

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      labels,
			Annotations: req.Annotations,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Strategy: buildStrategy(req.Strategy),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": req.Name},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels:      labels,
					Annotations: req.Annotations,
				},
				Spec: corev1.PodSpec{
					Containers:         []corev1.Container{container},
					ImagePullSecrets:   buildImagePullSecrets(req.ImagePullSecrets),
					ServiceAccountName: req.ServiceAccount,
				},
			},
		},
	}

	return clientset.AppsV1().Deployments(req.Namespace).Create(ctx, deployment, metav1.CreateOptions{})
}

func buildPorts(ports []int32) []corev1.ContainerPort {
	out := make([]corev1.ContainerPort, len(ports))
	for i, p := range ports {
		out[i] = corev1.ContainerPort{ContainerPort: p}
	}
	return out
}

func buildEnvVars(envVars map[string]string) []corev1.EnvVar {
	out := make([]corev1.EnvVar, 0, len(envVars))
	for k, v := range envVars {
		out = append(out, corev1.EnvVar{Name: k, Value: v})
	}
	return out
}

func buildEnvFrom(envFrom []types.EnvFrom) []corev1.EnvFromSource {
	out := make([]corev1.EnvFromSource, 0, len(envFrom))
	for _, e := range envFrom {
		src := corev1.EnvFromSource{}
		if e.ConfigMapRef != "" {
			src.ConfigMapRef = &corev1.ConfigMapEnvSource{
				LocalObjectReference: corev1.LocalObjectReference{Name: e.ConfigMapRef},
			}
		}
		if e.SecretRef != "" {
			src.SecretRef = &corev1.SecretEnvSource{
				LocalObjectReference: corev1.LocalObjectReference{Name: e.SecretRef},
			}
		}
		out = append(out, src)
	}
	return out
}

func buildResources(r *types.ResourceRequirements) corev1.ResourceRequirements {
	if r == nil {
		return corev1.ResourceRequirements{}
	}
	out := corev1.ResourceRequirements{}
	if r.Requests != nil {
		out.Requests = corev1.ResourceList{}
		if r.Requests.CPU != "" {
			out.Requests[corev1.ResourceCPU] = resource.MustParse(r.Requests.CPU)
		}
		if r.Requests.Memory != "" {
			out.Requests[corev1.ResourceMemory] = resource.MustParse(r.Requests.Memory)
		}
	}
	if r.Limits != nil {
		out.Limits = corev1.ResourceList{}
		if r.Limits.CPU != "" {
			out.Limits[corev1.ResourceCPU] = resource.MustParse(r.Limits.CPU)
		}
		if r.Limits.Memory != "" {
			out.Limits[corev1.ResourceMemory] = resource.MustParse(r.Limits.Memory)
		}
	}
	return out
}

func buildProbe(p *types.Probe) *corev1.Probe {
	if p == nil {
		return nil
	}
	probe := &corev1.Probe{
		ProbeHandler: corev1.ProbeHandler{
			HTTPGet: &corev1.HTTPGetAction{
				Path: p.Path,
				Port: intstr.FromInt32(p.Port),
			},
		},
	}
	if p.InitialDelaySeconds > 0 {
		probe.InitialDelaySeconds = p.InitialDelaySeconds
	}
	if p.PeriodSeconds > 0 {
		probe.PeriodSeconds = p.PeriodSeconds
	}
	if p.FailureThreshold > 0 {
		probe.FailureThreshold = p.FailureThreshold
	}
	return probe
}

func buildStrategy(s *types.DeploymentStrategy) appsv1.DeploymentStrategy {
	if s == nil {
		return appsv1.DeploymentStrategy{Type: appsv1.RollingUpdateDeploymentStrategyType}
	}
	if s.Type == "Recreate" {
		return appsv1.DeploymentStrategy{Type: appsv1.RecreateDeploymentStrategyType}
	}
	ru := &appsv1.RollingUpdateDeployment{}
	if s.MaxSurge != nil {
		val := intstr.FromInt32(*s.MaxSurge)
		ru.MaxSurge = &val
	}
	if s.MaxUnavailable != nil {
		val := intstr.FromInt32(*s.MaxUnavailable)
		ru.MaxUnavailable = &val
	}
	return appsv1.DeploymentStrategy{
		Type:          appsv1.RollingUpdateDeploymentStrategyType,
		RollingUpdate: ru,
	}
}

func buildImagePullSecrets(secrets []string) []corev1.LocalObjectReference {
	out := make([]corev1.LocalObjectReference, len(secrets))
	for i, s := range secrets {
		out[i] = corev1.LocalObjectReference{Name: s}
	}
	return out
}
