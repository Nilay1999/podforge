package services

import (
	"context"
	"fmt"
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

	mainContainer, err := buildMainContainer(req)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	sidecars, err := buildSidecarContainers(req.Sidecars)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("sidecars: %w", err)}
	}

	initContainers, err := buildSidecarContainers(req.InitContainers)
	if err != nil {
		return nil, &types.ValidationError{Err: fmt.Errorf("initContainers: %w", err)}
	}

	volumes, err := buildVolumes(req.Volumes)
	if err != nil {
		return nil, &types.ValidationError{Err: err}
	}

	podSpec := corev1.PodSpec{
		Containers:                    append([]corev1.Container{mainContainer}, sidecars...),
		InitContainers:                initContainers,
		Volumes:                       volumes,
		ImagePullSecrets:              buildImagePullSecrets(req.ImagePullSecrets),
		ServiceAccountName:            req.ServiceAccount,
		NodeSelector:                  req.NodeSelector,
		NodeName:                      req.NodeName,
		Tolerations:                   buildTolerations(req.Tolerations),
		Affinity:                      buildAffinity(req.Affinity),
		TopologySpreadConstraints:     buildTopologySpreadConstraints(req.TopologySpreadConstraints),
		SecurityContext:               buildPodSecurityContext(req.PodSecurityContext),
		TerminationGracePeriodSeconds: req.TerminationGracePeriodSeconds,
		PriorityClassName:             req.PriorityClassName,
		DNSPolicy:                     buildDNSPolicy(req.DNSPolicy),
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
			Strategy:                buildStrategy(req.Strategy),
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

func buildMainContainer(req types.CreateDeploymentRequest) (corev1.Container, error) {
	resources, err := buildResources(req.Resources)
	if err != nil {
		return corev1.Container{}, err
	}
	livenessProbe, err := buildProbe(req.LivenessProbe)
	if err != nil {
		return corev1.Container{}, fmt.Errorf("livenessProbe: %w", err)
	}
	readinessProbe, err := buildProbe(req.ReadinessProbe)
	if err != nil {
		return corev1.Container{}, fmt.Errorf("readinessProbe: %w", err)
	}
	startupProbe, err := buildProbe(req.StartupProbe)
	if err != nil {
		return corev1.Container{}, fmt.Errorf("startupProbe: %w", err)
	}
	return corev1.Container{
		Name:            req.Name,
		Image:           req.Image,
		Command:         req.Command,
		Args:            req.Args,
		WorkingDir:      req.WorkingDir,
		Ports:           buildContainerPorts(req.Ports),
		Env:             buildEnvVars(req.EnvVars),
		EnvFrom:         buildEnvFrom(req.EnvFrom),
		ImagePullPolicy: buildImagePullPolicy(req.ImagePullPolicy),
		Resources:       resources,
		VolumeMounts:    buildVolumeMounts(req.VolumeMounts),
		LivenessProbe:   livenessProbe,
		ReadinessProbe:  readinessProbe,
		StartupProbe:    startupProbe,
		Lifecycle:       buildLifecycle(req.Lifecycle),
		SecurityContext: buildContainerSecurityContext(req.ContainerSecurityContext),
	}, nil
}

func buildSidecarContainers(containers []types.SidecarContainer) ([]corev1.Container, error) {
	out := make([]corev1.Container, 0, len(containers))
	for _, c := range containers {
		resources, err := buildResources(c.Resources)
		if err != nil {
			return nil, fmt.Errorf("container %q: %w", c.Name, err)
		}
		livenessProbe, err := buildProbe(c.LivenessProbe)
		if err != nil {
			return nil, fmt.Errorf("container %q livenessProbe: %w", c.Name, err)
		}
		readinessProbe, err := buildProbe(c.ReadinessProbe)
		if err != nil {
			return nil, fmt.Errorf("container %q readinessProbe: %w", c.Name, err)
		}
		startupProbe, err := buildProbe(c.StartupProbe)
		if err != nil {
			return nil, fmt.Errorf("container %q startupProbe: %w", c.Name, err)
		}
		out = append(out, corev1.Container{
			Name:            c.Name,
			Image:           c.Image,
			Command:         c.Command,
			Args:            c.Args,
			WorkingDir:      c.WorkingDir,
			Ports:           buildContainerPorts(c.Ports),
			Env:             buildEnvVars(c.EnvVars),
			EnvFrom:         buildEnvFrom(c.EnvFrom),
			ImagePullPolicy: buildImagePullPolicy(c.ImagePullPolicy),
			Resources:       resources,
			VolumeMounts:    buildVolumeMounts(c.VolumeMounts),
			LivenessProbe:   livenessProbe,
			ReadinessProbe:  readinessProbe,
			StartupProbe:    startupProbe,
			Lifecycle:       buildLifecycle(c.Lifecycle),
			SecurityContext: buildContainerSecurityContext(c.SecurityContext),
		})
	}
	return out, nil
}

func buildContainerPorts(ports []types.ContainerPort) []corev1.ContainerPort {
	out := make([]corev1.ContainerPort, len(ports))
	for i, p := range ports {
		cp := corev1.ContainerPort{
			Name:          p.Name,
			ContainerPort: p.ContainerPort,
			HostPort:      p.HostPort,
		}
		if p.Protocol != "" {
			cp.Protocol = corev1.Protocol(p.Protocol)
		} else {
			cp.Protocol = corev1.ProtocolTCP
		}
		out[i] = cp
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
		src := corev1.EnvFromSource{Prefix: e.Prefix}
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

func buildImagePullPolicy(policy string) corev1.PullPolicy {
	switch policy {
	case "Always":
		return corev1.PullAlways
	case "Never":
		return corev1.PullNever
	case "IfNotPresent":
		return corev1.PullIfNotPresent
	default:
		return ""
	}
}

// ── Resources ────────────────────────────────────────────────────────────────

func buildResources(r *types.ResourceRequirements) (corev1.ResourceRequirements, error) {
	if r == nil {
		return corev1.ResourceRequirements{}, nil
	}
	out := corev1.ResourceRequirements{}
	var err error
	if r.Requests != nil {
		out.Requests, err = buildResourceList(r.Requests)
		if err != nil {
			return out, fmt.Errorf("resources.requests: %w", err)
		}
	}
	if r.Limits != nil {
		out.Limits, err = buildResourceList(r.Limits)
		if err != nil {
			return out, fmt.Errorf("resources.limits: %w", err)
		}
	}
	return out, nil
}

func buildResourceList(rl *types.ResourceList) (corev1.ResourceList, error) {
	list := corev1.ResourceList{}
	if rl.CPU != "" {
		q, err := resource.ParseQuantity(rl.CPU)
		if err != nil {
			return nil, fmt.Errorf("invalid cpu %q: %w", rl.CPU, err)
		}
		list[corev1.ResourceCPU] = q
	}
	if rl.Memory != "" {
		q, err := resource.ParseQuantity(rl.Memory)
		if err != nil {
			return nil, fmt.Errorf("invalid memory %q: %w", rl.Memory, err)
		}
		list[corev1.ResourceMemory] = q
	}
	if rl.EphemeralStorage != "" {
		q, err := resource.ParseQuantity(rl.EphemeralStorage)
		if err != nil {
			return nil, fmt.Errorf("invalid ephemeral-storage %q: %w", rl.EphemeralStorage, err)
		}
		list[corev1.ResourceEphemeralStorage] = q
	}
	return list, nil
}

// ── Probes ───────────────────────────────────────────────────────────────────

func buildProbe(p *types.Probe) (*corev1.Probe, error) {
	if p == nil {
		return nil, nil
	}
	handler := corev1.ProbeHandler{}
	switch {
	case p.HTTPGet != nil:
		headers := make([]corev1.HTTPHeader, 0, len(p.HTTPGet.HTTPHeaders))
		for k, v := range p.HTTPGet.HTTPHeaders {
			headers = append(headers, corev1.HTTPHeader{Name: k, Value: v})
		}
		handler.HTTPGet = &corev1.HTTPGetAction{
			Path:        p.HTTPGet.Path,
			Port:        intstr.FromInt32(p.HTTPGet.Port),
			HTTPHeaders: headers,
		}
	case p.Exec != nil:
		handler.Exec = &corev1.ExecAction{Command: p.Exec.Command}
	case p.TCPSocket != nil:
		handler.TCPSocket = &corev1.TCPSocketAction{
			Port: intstr.FromInt32(p.TCPSocket.Port),
		}
	default:
		return nil, fmt.Errorf("probe must specify one of: httpGet, exec, tcpSocket")
	}
	return &corev1.Probe{
		ProbeHandler:        handler,
		InitialDelaySeconds: p.InitialDelaySeconds,
		PeriodSeconds:       p.PeriodSeconds,
		TimeoutSeconds:      p.TimeoutSeconds,
		SuccessThreshold:    p.SuccessThreshold,
		FailureThreshold:    p.FailureThreshold,
	}, nil
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

func buildLifecycle(l *types.Lifecycle) *corev1.Lifecycle {
	if l == nil {
		return nil
	}
	return &corev1.Lifecycle{
		PostStart: buildLifecycleHandler(l.PostStart),
		PreStop:   buildLifecycleHandler(l.PreStop),
	}
}

func buildLifecycleHandler(h *types.LifecycleHandler) *corev1.LifecycleHandler {
	if h == nil {
		return nil
	}
	out := &corev1.LifecycleHandler{}
	if h.Exec != nil {
		out.Exec = &corev1.ExecAction{Command: h.Exec.Command}
	}
	if h.HTTPGet != nil {
		headers := make([]corev1.HTTPHeader, 0, len(h.HTTPGet.HTTPHeaders))
		for k, v := range h.HTTPGet.HTTPHeaders {
			headers = append(headers, corev1.HTTPHeader{Name: k, Value: v})
		}
		out.HTTPGet = &corev1.HTTPGetAction{
			Path:        h.HTTPGet.Path,
			Port:        intstr.FromInt32(h.HTTPGet.Port),
			HTTPHeaders: headers,
		}
	}
	return out
}

// ── Volumes ──────────────────────────────────────────────────────────────────

func buildVolumeMounts(mounts []types.VolumeMount) []corev1.VolumeMount {
	out := make([]corev1.VolumeMount, len(mounts))
	for i, m := range mounts {
		out[i] = corev1.VolumeMount{
			Name:      m.Name,
			MountPath: m.MountPath,
			SubPath:   m.SubPath,
			ReadOnly:  m.ReadOnly,
		}
	}
	return out
}

func buildVolumes(volumes []types.Volume) ([]corev1.Volume, error) {
	out := make([]corev1.Volume, 0, len(volumes))
	for _, v := range volumes {
		kv := corev1.Volume{Name: v.Name}
		switch {
		case v.ConfigMap != nil:
			src := &corev1.ConfigMapVolumeSource{
				LocalObjectReference: corev1.LocalObjectReference{Name: v.ConfigMap.Name},
				DefaultMode:          v.ConfigMap.DefaultMode,
				Optional:             v.ConfigMap.Optional,
			}
			for _, item := range v.ConfigMap.Items {
				src.Items = append(src.Items, corev1.KeyToPath{Key: item.Key, Path: item.Path, Mode: item.Mode})
			}
			kv.ConfigMap = src
		case v.Secret != nil:
			src := &corev1.SecretVolumeSource{
				SecretName:  v.Secret.SecretName,
				DefaultMode: v.Secret.DefaultMode,
				Optional:    v.Secret.Optional,
			}
			for _, item := range v.Secret.Items {
				src.Items = append(src.Items, corev1.KeyToPath{Key: item.Key, Path: item.Path, Mode: item.Mode})
			}
			kv.Secret = src
		case v.EmptyDir != nil:
			ed := &corev1.EmptyDirVolumeSource{}
			if v.EmptyDir.Medium != "" {
				ed.Medium = corev1.StorageMedium(v.EmptyDir.Medium)
			}
			if v.EmptyDir.SizeLimit != "" {
				q, err := resource.ParseQuantity(v.EmptyDir.SizeLimit)
				if err != nil {
					return nil, fmt.Errorf("volume %q: invalid emptyDir.sizeLimit %q: %w", v.Name, v.EmptyDir.SizeLimit, err)
				}
				ed.SizeLimit = &q
			}
			kv.EmptyDir = ed
		case v.PersistentVolumeClaim != nil:
			kv.PersistentVolumeClaim = &corev1.PersistentVolumeClaimVolumeSource{
				ClaimName: v.PersistentVolumeClaim.ClaimName,
				ReadOnly:  v.PersistentVolumeClaim.ReadOnly,
			}
		case v.HostPath != nil:
			hp := &corev1.HostPathVolumeSource{Path: v.HostPath.Path}
			if v.HostPath.Type != "" {
				t := corev1.HostPathType(v.HostPath.Type)
				hp.Type = &t
			}
			kv.HostPath = hp
		}
		out = append(out, kv)
	}
	return out, nil
}

// ── Security ─────────────────────────────────────────────────────────────────

func buildPodSecurityContext(sc *types.PodSecurityContext) *corev1.PodSecurityContext {
	if sc == nil {
		return nil
	}
	return &corev1.PodSecurityContext{
		RunAsUser:    sc.RunAsUser,
		RunAsGroup:   sc.RunAsGroup,
		RunAsNonRoot: sc.RunAsNonRoot,
		FSGroup:      sc.FSGroup,
	}
}

func buildContainerSecurityContext(sc *types.ContainerSecurityContext) *corev1.SecurityContext {
	if sc == nil {
		return nil
	}
	out := &corev1.SecurityContext{
		RunAsUser:                sc.RunAsUser,
		RunAsGroup:               sc.RunAsGroup,
		RunAsNonRoot:             sc.RunAsNonRoot,
		ReadOnlyRootFilesystem:   sc.ReadOnlyRootFilesystem,
		AllowPrivilegeEscalation: sc.AllowPrivilegeEscalation,
		Privileged:               sc.Privileged,
	}
	if sc.Capabilities != nil {
		caps := &corev1.Capabilities{}
		for _, c := range sc.Capabilities.Add {
			caps.Add = append(caps.Add, corev1.Capability(c))
		}
		for _, c := range sc.Capabilities.Drop {
			caps.Drop = append(caps.Drop, corev1.Capability(c))
		}
		out.Capabilities = caps
	}
	return out
}

// ── Scheduling ───────────────────────────────────────────────────────────────

func buildImagePullSecrets(secrets []string) []corev1.LocalObjectReference {
	out := make([]corev1.LocalObjectReference, len(secrets))
	for i, s := range secrets {
		out[i] = corev1.LocalObjectReference{Name: s}
	}
	return out
}

func buildTolerations(tolerations []types.Toleration) []corev1.Toleration {
	out := make([]corev1.Toleration, len(tolerations))
	for i, t := range tolerations {
		out[i] = corev1.Toleration{
			Key:               t.Key,
			Operator:          corev1.TolerationOperator(t.Operator),
			Value:             t.Value,
			Effect:            corev1.TaintEffect(t.Effect),
			TolerationSeconds: t.TolerationSeconds,
		}
	}
	return out
}

func buildAffinity(a *types.Affinity) *corev1.Affinity {
	if a == nil {
		return nil
	}
	out := &corev1.Affinity{}

	if a.NodeAffinity != nil {
		na := &corev1.NodeAffinity{}
		if len(a.NodeAffinity.RequiredMatchExpressions) > 0 {
			exprs := buildNodeSelectorRequirements(a.NodeAffinity.RequiredMatchExpressions)
			na.RequiredDuringSchedulingIgnoredDuringExecution = &corev1.NodeSelector{
				NodeSelectorTerms: []corev1.NodeSelectorTerm{{MatchExpressions: exprs}},
			}
		}
		for _, p := range a.NodeAffinity.PreferredMatchExpressions {
			exprs := buildNodeSelectorRequirements(p.MatchExpressions)
			na.PreferredDuringSchedulingIgnoredDuringExecution = append(
				na.PreferredDuringSchedulingIgnoredDuringExecution,
				corev1.PreferredSchedulingTerm{
					Weight:     p.Weight,
					Preference: corev1.NodeSelectorTerm{MatchExpressions: exprs},
				},
			)
		}
		out.NodeAffinity = na
	}

	if a.PodAffinity != nil {
		out.PodAffinity = &corev1.PodAffinity{
			RequiredDuringSchedulingIgnoredDuringExecution:  buildPodAffinityTerms(a.PodAffinity.Required),
			PreferredDuringSchedulingIgnoredDuringExecution: buildWeightedPodAffinityTerms(a.PodAffinity.Preferred),
		}
	}

	if a.PodAntiAffinity != nil {
		out.PodAntiAffinity = &corev1.PodAntiAffinity{
			RequiredDuringSchedulingIgnoredDuringExecution:  buildPodAffinityTerms(a.PodAntiAffinity.Required),
			PreferredDuringSchedulingIgnoredDuringExecution: buildWeightedPodAffinityTerms(a.PodAntiAffinity.Preferred),
		}
	}

	return out
}

func buildNodeSelectorRequirements(exprs []types.NodeSelectorRequirement) []corev1.NodeSelectorRequirement {
	out := make([]corev1.NodeSelectorRequirement, len(exprs))
	for i, e := range exprs {
		out[i] = corev1.NodeSelectorRequirement{
			Key:      e.Key,
			Operator: corev1.NodeSelectorOperator(e.Operator),
			Values:   e.Values,
		}
	}
	return out
}

func buildPodAffinityTerms(terms []types.PodAffinityTerm) []corev1.PodAffinityTerm {
	out := make([]corev1.PodAffinityTerm, len(terms))
	for i, t := range terms {
		term := corev1.PodAffinityTerm{
			TopologyKey: t.TopologyKey,
			Namespaces:  t.Namespaces,
		}
		if len(t.MatchLabels) > 0 || len(t.MatchExpressions) > 0 {
			ls := &metav1.LabelSelector{MatchLabels: t.MatchLabels}
			for _, e := range t.MatchExpressions {
				ls.MatchExpressions = append(ls.MatchExpressions, metav1.LabelSelectorRequirement{
					Key:      e.Key,
					Operator: metav1.LabelSelectorOperator(e.Operator),
					Values:   e.Values,
				})
			}
			term.LabelSelector = ls
		}
		out[i] = term
	}
	return out
}

func buildWeightedPodAffinityTerms(terms []types.WeightedPodAffinityTerm) []corev1.WeightedPodAffinityTerm {
	out := make([]corev1.WeightedPodAffinityTerm, len(terms))
	for i, t := range terms {
		inner := buildPodAffinityTerms([]types.PodAffinityTerm{t.PodAffinityTerm})
		out[i] = corev1.WeightedPodAffinityTerm{
			Weight:          t.Weight,
			PodAffinityTerm: inner[0],
		}
	}
	return out
}

func buildTopologySpreadConstraints(tscs []types.TopologySpreadConstraint) []corev1.TopologySpreadConstraint {
	out := make([]corev1.TopologySpreadConstraint, len(tscs))
	for i, t := range tscs {
		tsc := corev1.TopologySpreadConstraint{
			MaxSkew:           t.MaxSkew,
			TopologyKey:       t.TopologyKey,
			WhenUnsatisfiable: corev1.UnsatisfiableConstraintAction(t.WhenUnsatisfiable),
		}
		if len(t.MatchLabels) > 0 {
			tsc.LabelSelector = &metav1.LabelSelector{MatchLabels: t.MatchLabels}
		}
		out[i] = tsc
	}
	return out
}

// ── Rollout ───────────────────────────────────────────────────────────────────

func buildStrategy(s *types.DeploymentStrategy) appsv1.DeploymentStrategy {
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

func buildDNSPolicy(policy string) corev1.DNSPolicy {
	switch policy {
	case "ClusterFirst":
		return corev1.DNSClusterFirst
	case "ClusterFirstWithHostNet":
		return corev1.DNSClusterFirstWithHostNet
	case "Default":
		return corev1.DNSDefault
	case "None":
		return corev1.DNSNone
	default:
		return ""
	}
}
