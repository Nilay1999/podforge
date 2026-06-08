package builders

import (
	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

func BuildService(req types.CreateServiceRequest) *corev1.Service {
	spec := corev1.ServiceSpec{
		Type:                     corev1.ServiceType(req.Type),
		Selector:                 req.Selector,
		Ports:                    BuildServicePorts(req.Ports),
		ClusterIP:                req.ClusterIP,
		ExternalName:             req.ExternalName,
		ExternalIPs:              req.ExternalIPs,
		SessionAffinity:          corev1.ServiceAffinity(req.SessionAffinity),
		ExternalTrafficPolicy:    corev1.ServiceExternalTrafficPolicy(req.ExternalTrafficPolicy),
		InternalTrafficPolicy:    buildInternalTrafficPolicy(req.InternalTrafficPolicy),
		LoadBalancerIP:           req.LoadBalancerIP,
		LoadBalancerSourceRanges: req.LoadBalancerSourceRanges,
		HealthCheckNodePort:      req.HealthCheckNodePort,
		PublishNotReadyAddresses: req.PublishNotReadyAddresses,
	}

	if req.SessionAffinity == "ClientIP" && req.SessionAffinityTimeoutSeconds != nil {
		spec.SessionAffinityConfig = &corev1.SessionAffinityConfig{
			ClientIP: &corev1.ClientIPConfig{TimeoutSeconds: req.SessionAffinityTimeoutSeconds},
		}
	}

	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Namespace:   req.Namespace,
			Labels:      req.Labels,
			Annotations: req.Annotations,
		},
		Spec: spec,
	}
}

func BuildServicePorts(ports []types.ServicePort) []corev1.ServicePort {
	out := make([]corev1.ServicePort, len(ports))
	for i, p := range ports {
		sp := corev1.ServicePort{
			Name:     p.Name,
			Port:     p.Port,
			NodePort: p.NodePort,
			Protocol: corev1.ProtocolTCP,
		}
		if p.Protocol != "" {
			sp.Protocol = corev1.Protocol(p.Protocol)
		}
		if p.AppProtocol != "" {
			ap := p.AppProtocol
			sp.AppProtocol = &ap
		}
		if p.TargetPort != "" {
			sp.TargetPort = intstr.Parse(p.TargetPort)
		} else {
			sp.TargetPort = intstr.FromInt32(p.Port)
		}
		out[i] = sp
	}
	return out
}

func buildInternalTrafficPolicy(p string) *corev1.ServiceInternalTrafficPolicy {
	if p == "" {
		return nil
	}
	tp := corev1.ServiceInternalTrafficPolicy(p)
	return &tp
}
