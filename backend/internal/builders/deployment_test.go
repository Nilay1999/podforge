package builders

import (
	"errors"
	"testing"

	"github.com/podforge/backend/internal/types"
	appsv1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

func validDeploymentReq() types.CreateDeploymentRequest {
	return types.CreateDeploymentRequest{
		Name:      "api",
		Namespace: "default",
		Image:     "api:v1",
		Replicas:  3,
	}
}

func TestBuildDeployment_MergesAppLabelAndSelector(t *testing.T) {
	req := validDeploymentReq()
	req.Labels = map[string]string{"team": "platform"}

	dep, err := BuildDeployment(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if dep.Labels["app"] != "api" {
		t.Errorf("Labels[app] = %q, want api", dep.Labels["app"])
	}
	if dep.Labels["team"] != "platform" {
		t.Errorf("Labels[team] = %q, want platform (custom label should be merged)", dep.Labels["team"])
	}

	// Selector must match only the stable app label, not user labels that may change.
	if got := dep.Spec.Selector.MatchLabels; got["app"] != "api" || len(got) != 1 {
		t.Errorf("selector matchLabels = %v, want {app: api}", got)
	}
}

func TestBuildDeployment_ReplicasPointer(t *testing.T) {
	dep, err := BuildDeployment(validDeploymentReq())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dep.Spec.Replicas == nil {
		t.Fatal("Replicas pointer is nil")
	}
	if *dep.Spec.Replicas != 3 {
		t.Errorf("Replicas = %d, want 3", *dep.Spec.Replicas)
	}
}

func TestBuildDeployment_MainContainerFirstThenSidecars(t *testing.T) {
	req := validDeploymentReq()
	req.Sidecars = []types.SidecarContainer{
		{Name: "logger", Image: "fluentbit:2"},
	}

	dep, err := BuildDeployment(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	containers := dep.Spec.Template.Spec.Containers
	if len(containers) != 2 {
		t.Fatalf("expected 2 containers (main + sidecar), got %d", len(containers))
	}
	if containers[0].Name != "api" {
		t.Errorf("containers[0] = %q, want api (main container first)", containers[0].Name)
	}
	if containers[1].Name != "logger" {
		t.Errorf("containers[1] = %q, want logger", containers[1].Name)
	}
}

func TestBuildDeployment_InvalidInputIsValidationError(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*types.CreateDeploymentRequest)
	}{
		{
			name: "invalid main container resources",
			mutate: func(r *types.CreateDeploymentRequest) {
				r.Resources = &types.ResourceRequirements{Limits: &types.ResourceList{CPU: "bad"}}
			},
		},
		{
			name: "invalid sidecar resources",
			mutate: func(r *types.CreateDeploymentRequest) {
				r.Sidecars = []types.SidecarContainer{
					{Name: "side", Image: "x", Resources: &types.ResourceRequirements{Requests: &types.ResourceList{Memory: "bad"}}},
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := validDeploymentReq()
			tt.mutate(&req)

			_, err := BuildDeployment(req)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			var verr *types.ValidationError
			if !errors.As(err, &verr) {
				t.Errorf("expected *types.ValidationError, got %T", err)
			}
		})
	}
}

func TestBuildStrategy(t *testing.T) {
	t.Run("nil defaults to RollingUpdate", func(t *testing.T) {
		got := BuildStrategy(nil)
		if got.Type != appsv1.RollingUpdateDeploymentStrategyType {
			t.Errorf("Type = %q, want RollingUpdate", got.Type)
		}
	})

	t.Run("Recreate", func(t *testing.T) {
		got := BuildStrategy(&types.DeploymentStrategy{Type: "Recreate"})
		if got.Type != appsv1.RecreateDeploymentStrategyType {
			t.Errorf("Type = %q, want Recreate", got.Type)
		}
		if got.RollingUpdate != nil {
			t.Errorf("RollingUpdate should be nil for Recreate, got %+v", got.RollingUpdate)
		}
	})

	t.Run("RollingUpdate with surge and unavailable", func(t *testing.T) {
		got := BuildStrategy(&types.DeploymentStrategy{
			Type:           "RollingUpdate",
			MaxSurge:       "25%",
			MaxUnavailable: "1",
		})
		if got.Type != appsv1.RollingUpdateDeploymentStrategyType {
			t.Fatalf("Type = %q, want RollingUpdate", got.Type)
		}
		if got.RollingUpdate == nil {
			t.Fatal("RollingUpdate is nil")
		}
		wantSurge := intstr.FromString("25%")
		if *got.RollingUpdate.MaxSurge != wantSurge {
			t.Errorf("MaxSurge = %v, want 25%%", *got.RollingUpdate.MaxSurge)
		}
		wantUnavail := intstr.FromInt32(1)
		if *got.RollingUpdate.MaxUnavailable != wantUnavail {
			t.Errorf("MaxUnavailable = %v, want 1", *got.RollingUpdate.MaxUnavailable)
		}
	})
}
