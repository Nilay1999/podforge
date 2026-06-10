package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

func TestBuildServicePorts(t *testing.T) {
	tests := []struct {
		name           string
		in             types.ServicePort
		wantTargetPort intstr.IntOrString
		wantProtocol   corev1.Protocol
	}{
		{
			name:           "targetPort defaults to port when empty",
			in:             types.ServicePort{Port: 80},
			wantTargetPort: intstr.FromInt32(80),
			wantProtocol:   corev1.ProtocolTCP,
		},
		{
			name:           "numeric targetPort is parsed",
			in:             types.ServicePort{Port: 80, TargetPort: "8080"},
			wantTargetPort: intstr.FromInt32(8080),
			wantProtocol:   corev1.ProtocolTCP,
		},
		{
			name:           "named targetPort is preserved",
			in:             types.ServicePort{Port: 80, TargetPort: "http"},
			wantTargetPort: intstr.FromString("http"),
			wantProtocol:   corev1.ProtocolTCP,
		},
		{
			name:           "explicit protocol is preserved",
			in:             types.ServicePort{Port: 53, Protocol: "UDP"},
			wantTargetPort: intstr.FromInt32(53),
			wantProtocol:   corev1.ProtocolUDP,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildServicePorts([]types.ServicePort{tt.in})
			if len(got) != 1 {
				t.Fatalf("expected 1 port, got %d", len(got))
			}
			if got[0].TargetPort != tt.wantTargetPort {
				t.Errorf("TargetPort = %v, want %v", got[0].TargetPort, tt.wantTargetPort)
			}
			if got[0].Protocol != tt.wantProtocol {
				t.Errorf("Protocol = %q, want %q", got[0].Protocol, tt.wantProtocol)
			}
		})
	}
}

func TestBuildService_SessionAffinityConfig(t *testing.T) {
	timeout := int32(30)

	t.Run("ClientIP with timeout sets affinity config", func(t *testing.T) {
		svc := BuildService(types.CreateServiceRequest{
			Name:                          "web",
			Namespace:                     "default",
			SessionAffinity:               "ClientIP",
			SessionAffinityTimeoutSeconds: &timeout,
		})
		if svc.Spec.SessionAffinityConfig == nil {
			t.Fatal("expected SessionAffinityConfig to be set")
		}
		if got := *svc.Spec.SessionAffinityConfig.ClientIP.TimeoutSeconds; got != 30 {
			t.Errorf("timeout = %d, want 30", got)
		}
	})

	t.Run("None leaves affinity config nil", func(t *testing.T) {
		svc := BuildService(types.CreateServiceRequest{
			Name:            "web",
			Namespace:       "default",
			SessionAffinity: "None",
		})
		if svc.Spec.SessionAffinityConfig != nil {
			t.Errorf("expected nil SessionAffinityConfig, got %+v", svc.Spec.SessionAffinityConfig)
		}
	})
}

func TestBuildService_InternalTrafficPolicy(t *testing.T) {
	t.Run("empty leaves policy nil", func(t *testing.T) {
		svc := BuildService(types.CreateServiceRequest{Name: "web", Namespace: "default"})
		if svc.Spec.InternalTrafficPolicy != nil {
			t.Errorf("expected nil InternalTrafficPolicy, got %v", *svc.Spec.InternalTrafficPolicy)
		}
	})

	t.Run("set populates policy pointer", func(t *testing.T) {
		svc := BuildService(types.CreateServiceRequest{
			Name:                  "web",
			Namespace:             "default",
			InternalTrafficPolicy: "Local",
		})
		if svc.Spec.InternalTrafficPolicy == nil || *svc.Spec.InternalTrafficPolicy != corev1.ServiceInternalTrafficPolicyLocal {
			t.Errorf("InternalTrafficPolicy = %v, want Local", svc.Spec.InternalTrafficPolicy)
		}
	})
}
