package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/util/intstr"
)

func TestBuildContainerPorts(t *testing.T) {
	tests := []struct {
		name         string
		in           []types.ContainerPort
		wantProtocol corev1.Protocol
	}{
		{
			name:         "defaults protocol to TCP when empty",
			in:           []types.ContainerPort{{ContainerPort: 80}},
			wantProtocol: corev1.ProtocolTCP,
		},
		{
			name:         "preserves explicit protocol",
			in:           []types.ContainerPort{{ContainerPort: 53, Protocol: "UDP"}},
			wantProtocol: corev1.ProtocolUDP,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildContainerPorts(tt.in)
			if len(got) != 1 {
				t.Fatalf("expected 1 port, got %d", len(got))
			}
			if got[0].Protocol != tt.wantProtocol {
				t.Errorf("protocol = %q, want %q", got[0].Protocol, tt.wantProtocol)
			}
		})
	}
}

func TestBuildResourceList_Valid(t *testing.T) {
	in := &types.ResourceList{CPU: "500m", Memory: "256Mi", EphemeralStorage: "1Gi"}

	got, err := BuildResourceList(in)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := corev1.ResourceList{
		corev1.ResourceCPU:              resource.MustParse("500m"),
		corev1.ResourceMemory:           resource.MustParse("256Mi"),
		corev1.ResourceEphemeralStorage: resource.MustParse("1Gi"),
	}
	for k, wantQ := range want {
		gotQ, ok := got[k]
		if !ok {
			t.Errorf("missing resource %q", k)
			continue
		}
		if gotQ.Cmp(wantQ) != 0 {
			t.Errorf("%q = %s, want %s", k, gotQ.String(), wantQ.String())
		}
	}
}

func TestBuildResourceList_InvalidQuantity(t *testing.T) {
	tests := []struct {
		name string
		in   *types.ResourceList
	}{
		{"bad cpu", &types.ResourceList{CPU: "abc"}},
		{"bad memory", &types.ResourceList{Memory: "ten-gigs"}},
		{"bad ephemeral", &types.ResourceList{EphemeralStorage: "??"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := BuildResourceList(tt.in); err == nil {
				t.Errorf("expected error for invalid quantity, got nil")
			}
		})
	}
}

func TestBuildProbe(t *testing.T) {
	t.Run("nil probe returns nil", func(t *testing.T) {
		got, err := BuildProbe(nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != nil {
			t.Errorf("expected nil probe, got %+v", got)
		}
	})

	t.Run("httpGet handler", func(t *testing.T) {
		got, err := BuildProbe(&types.Probe{HTTPGet: &types.HTTPGetAction{Path: "/healthz", Port: 8080}})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.HTTPGet == nil {
			t.Fatal("expected HTTPGet handler to be set")
		}
		if got.HTTPGet.Path != "/healthz" {
			t.Errorf("path = %q, want /healthz", got.HTTPGet.Path)
		}
		if got.HTTPGet.Port != intstr.FromInt32(8080) {
			t.Errorf("port = %v, want 8080", got.HTTPGet.Port)
		}
	})

	t.Run("exec handler", func(t *testing.T) {
		got, err := BuildProbe(&types.Probe{Exec: &types.ExecAction{Command: []string{"cat", "/ready"}}})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Exec == nil {
			t.Fatal("expected Exec handler to be set")
		}
	})

	t.Run("tcpSocket handler", func(t *testing.T) {
		got, err := BuildProbe(&types.Probe{TCPSocket: &types.TCPSocketAction{Port: 5432}})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.TCPSocket == nil {
			t.Fatal("expected TCPSocket handler to be set")
		}
	})

	t.Run("no handler is an error", func(t *testing.T) {
		if _, err := BuildProbe(&types.Probe{}); err == nil {
			t.Error("expected error when no handler specified, got nil")
		}
	})
}

func TestBuildImagePullPolicy(t *testing.T) {
	tests := []struct {
		in   string
		want corev1.PullPolicy
	}{
		{"Always", corev1.PullAlways},
		{"Never", corev1.PullNever},
		{"IfNotPresent", corev1.PullIfNotPresent},
		{"", ""},
		{"garbage", ""},
	}

	for _, tt := range tests {
		t.Run(tt.in, func(t *testing.T) {
			if got := BuildImagePullPolicy(tt.in); got != tt.want {
				t.Errorf("BuildImagePullPolicy(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestBuildDNSPolicy(t *testing.T) {
	tests := []struct {
		in   string
		want corev1.DNSPolicy
	}{
		{"ClusterFirst", corev1.DNSClusterFirst},
		{"ClusterFirstWithHostNet", corev1.DNSClusterFirstWithHostNet},
		{"Default", corev1.DNSDefault},
		{"None", corev1.DNSNone},
		{"", ""},
		{"unknown", ""},
	}

	for _, tt := range tests {
		t.Run(tt.in, func(t *testing.T) {
			if got := BuildDNSPolicy(tt.in); got != tt.want {
				t.Errorf("BuildDNSPolicy(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestBuildEnvVars(t *testing.T) {
	got := BuildEnvVars(map[string]string{"FOO": "bar", "BAZ": "qux"})
	if len(got) != 2 {
		t.Fatalf("expected 2 env vars, got %d", len(got))
	}

	// Map iteration order is non-deterministic, so index by name.
	byName := make(map[string]string, len(got))
	for _, e := range got {
		byName[e.Name] = e.Value
	}
	if byName["FOO"] != "bar" || byName["BAZ"] != "qux" {
		t.Errorf("env vars = %+v, want FOO=bar BAZ=qux", byName)
	}
}

func TestBuildResources_Nil(t *testing.T) {
	got, err := BuildResources(nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Requests != nil || got.Limits != nil {
		t.Errorf("expected empty requirements, got %+v", got)
	}
}

func TestBuildResources_PropagatesError(t *testing.T) {
	_, err := BuildResources(&types.ResourceRequirements{Limits: &types.ResourceList{CPU: "not-a-cpu"}})
	if err == nil {
		t.Fatal("expected error from invalid limit quantity, got nil")
	}
}
