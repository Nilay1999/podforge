package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
)

func TestBuildPodSecurityContext(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if got := BuildPodSecurityContext(nil); got != nil {
			t.Errorf("expected nil, got %+v", got)
		}
	})

	t.Run("maps fields", func(t *testing.T) {
		uid := int64(1000)
		nonRoot := true
		got := BuildPodSecurityContext(&types.PodSecurityContext{RunAsUser: &uid, RunAsNonRoot: &nonRoot})
		if got.RunAsUser == nil || *got.RunAsUser != 1000 {
			t.Errorf("RunAsUser = %v, want 1000", got.RunAsUser)
		}
		if got.RunAsNonRoot == nil || !*got.RunAsNonRoot {
			t.Errorf("RunAsNonRoot = %v, want true", got.RunAsNonRoot)
		}
	})
}

func TestBuildContainerSecurityContext(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if got := BuildContainerSecurityContext(nil); got != nil {
			t.Errorf("expected nil, got %+v", got)
		}
	})

	t.Run("maps capabilities add and drop", func(t *testing.T) {
		priv := true
		got := BuildContainerSecurityContext(&types.ContainerSecurityContext{
			Privileged: &priv,
			Capabilities: &types.Capabilities{
				Add:  []string{"NET_ADMIN"},
				Drop: []string{"ALL"},
			},
		})
		if got.Privileged == nil || !*got.Privileged {
			t.Errorf("Privileged = %v, want true", got.Privileged)
		}
		if got.Capabilities == nil {
			t.Fatal("expected Capabilities to be set")
		}
		if len(got.Capabilities.Add) != 1 || got.Capabilities.Add[0] != corev1.Capability("NET_ADMIN") {
			t.Errorf("Add = %+v, want [NET_ADMIN]", got.Capabilities.Add)
		}
		if len(got.Capabilities.Drop) != 1 || got.Capabilities.Drop[0] != corev1.Capability("ALL") {
			t.Errorf("Drop = %+v, want [ALL]", got.Capabilities.Drop)
		}
	})

	t.Run("no capabilities leaves field nil", func(t *testing.T) {
		got := BuildContainerSecurityContext(&types.ContainerSecurityContext{})
		if got.Capabilities != nil {
			t.Errorf("expected nil Capabilities, got %+v", got.Capabilities)
		}
	})
}

func TestBuildLifecycle(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if got := BuildLifecycle(nil); got != nil {
			t.Errorf("expected nil, got %+v", got)
		}
	})

	t.Run("maps postStart exec and preStop httpGet", func(t *testing.T) {
		got := BuildLifecycle(&types.Lifecycle{
			PostStart: &types.LifecycleHandler{Exec: &types.ExecAction{Command: []string{"echo", "hi"}}},
			PreStop:   &types.LifecycleHandler{HTTPGet: &types.HTTPGetAction{Path: "/quit", Port: 8080}},
		})
		if got.PostStart == nil || got.PostStart.Exec == nil {
			t.Fatalf("expected postStart exec, got %+v", got.PostStart)
		}
		if got.PreStop == nil || got.PreStop.HTTPGet == nil || got.PreStop.HTTPGet.Path != "/quit" {
			t.Fatalf("expected preStop httpGet /quit, got %+v", got.PreStop)
		}
	})
}

func TestBuildHostAliasesAndReadinessGates(t *testing.T) {
	aliases := BuildHostAliases([]types.HostAlias{{IP: "10.0.0.1", Hostnames: []string{"db.local"}}})
	if len(aliases) != 1 || aliases[0].IP != "10.0.0.1" || aliases[0].Hostnames[0] != "db.local" {
		t.Errorf("unexpected host aliases: %+v", aliases)
	}

	gates := BuildReadinessGates([]types.PodReadinessGate{{ConditionType: "www.example.com/feature"}})
	if len(gates) != 1 || gates[0].ConditionType != corev1.PodConditionType("www.example.com/feature") {
		t.Errorf("unexpected readiness gates: %+v", gates)
	}
}
