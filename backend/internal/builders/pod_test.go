package builders

import (
	"errors"
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
)

func validPodReq() types.CreatePodRequest {
	return types.CreatePodRequest{
		Name:      "web",
		Namespace: "default",
		Labels:    map[string]string{"app": "web"},
		Containers: []types.SidecarContainer{
			{Name: "main", Image: "nginx:1.27"},
		},
	}
}

func TestBuildPod_RequiresAtLeastOneContainer(t *testing.T) {
	req := validPodReq()
	req.Containers = nil

	_, err := BuildPod(req)
	if err == nil {
		t.Fatal("expected error when no containers supplied, got nil")
	}

	var verr *types.ValidationError
	if !errors.As(err, &verr) {
		t.Errorf("expected *types.ValidationError, got %T", err)
	}
}

func TestBuildPod_PropagatesContainerErrorAsValidation(t *testing.T) {
	req := validPodReq()
	req.Containers[0].Resources = &types.ResourceRequirements{
		Limits: &types.ResourceList{CPU: "not-a-quantity"},
	}

	_, err := BuildPod(req)
	if err == nil {
		t.Fatal("expected error from invalid container resources, got nil")
	}

	var verr *types.ValidationError
	if !errors.As(err, &verr) {
		t.Errorf("expected *types.ValidationError, got %T", err)
	}
}

func TestBuildPod_MapsMetadataAndContainers(t *testing.T) {
	req := validPodReq()

	pod, err := BuildPod(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if pod.Name != "web" {
		t.Errorf("Name = %q, want web", pod.Name)
	}
	if pod.Namespace != "default" {
		t.Errorf("Namespace = %q, want default", pod.Namespace)
	}
	if pod.Labels["app"] != "web" {
		t.Errorf("Labels[app] = %q, want web", pod.Labels["app"])
	}
	if len(pod.Spec.Containers) != 1 {
		t.Fatalf("expected 1 container, got %d", len(pod.Spec.Containers))
	}
	if pod.Spec.Containers[0].Image != "nginx:1.27" {
		t.Errorf("container image = %q, want nginx:1.27", pod.Spec.Containers[0].Image)
	}
}

func TestBuildPod_InvalidVolumeIsValidationError(t *testing.T) {
	req := validPodReq()
	req.Volumes = []types.Volume{
		{Name: "scratch", EmptyDir: &types.EmptyDirVolumeSource{SizeLimit: "not-a-size"}},
	}

	_, err := BuildPod(req)
	if err == nil {
		t.Fatal("expected error from invalid volume, got nil")
	}
	var verr *types.ValidationError
	if !errors.As(err, &verr) {
		t.Errorf("expected *types.ValidationError, got %T", err)
	}
}

func TestBuildPod_InvalidOverheadIsValidationError(t *testing.T) {
	req := validPodReq()
	req.Overhead = &types.ResourceList{CPU: "bad"}

	_, err := BuildPod(req)
	if err == nil {
		t.Fatal("expected error from invalid overhead, got nil")
	}
	var verr *types.ValidationError
	if !errors.As(err, &verr) {
		t.Errorf("expected *types.ValidationError, got %T", err)
	}
}

func TestBuildPod_OptionalPointerFields(t *testing.T) {
	t.Run("unset leaves pointers nil", func(t *testing.T) {
		pod, err := BuildPod(validPodReq())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if pod.Spec.RuntimeClassName != nil {
			t.Errorf("RuntimeClassName = %v, want nil", *pod.Spec.RuntimeClassName)
		}
		if pod.Spec.PreemptionPolicy != nil {
			t.Errorf("PreemptionPolicy = %v, want nil", *pod.Spec.PreemptionPolicy)
		}
	})

	t.Run("set populates pointers", func(t *testing.T) {
		req := validPodReq()
		req.RuntimeClassName = "gvisor"
		req.PreemptionPolicy = "Never"

		pod, err := BuildPod(req)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if pod.Spec.RuntimeClassName == nil || *pod.Spec.RuntimeClassName != "gvisor" {
			t.Errorf("RuntimeClassName = %v, want gvisor", pod.Spec.RuntimeClassName)
		}
		if pod.Spec.PreemptionPolicy == nil || *pod.Spec.PreemptionPolicy != corev1.PreemptNever {
			t.Errorf("PreemptionPolicy = %v, want Never", pod.Spec.PreemptionPolicy)
		}
	})
}
