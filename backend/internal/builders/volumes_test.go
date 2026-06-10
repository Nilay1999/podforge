package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
)

func TestBuildVolumes_AllSourceTypes(t *testing.T) {
	mode := int32(0644)
	in := []types.Volume{
		{Name: "cm", ConfigMap: &types.ConfigMapVolumeSource{
			Name:  "app-config",
			Items: []types.KeyToPath{{Key: "k", Path: "p", Mode: &mode}},
		}},
		{Name: "sec", Secret: &types.SecretVolumeSource{SecretName: "app-secret"}},
		{Name: "scratch", EmptyDir: &types.EmptyDirVolumeSource{Medium: "Memory", SizeLimit: "1Gi"}},
		{Name: "data", PersistentVolumeClaim: &types.PVCVolumeSource{ClaimName: "data-pvc", ReadOnly: true}},
		{Name: "host", HostPath: &types.HostPathVolumeSource{Path: "/var/log", Type: "Directory"}},
	}

	got, err := BuildVolumes(in)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 5 {
		t.Fatalf("expected 5 volumes, got %d", len(got))
	}

	if got[0].ConfigMap == nil || got[0].ConfigMap.Name != "app-config" {
		t.Errorf("volume[0] configMap = %+v", got[0].ConfigMap)
	}
	if len(got[0].ConfigMap.Items) != 1 || got[0].ConfigMap.Items[0].Key != "k" {
		t.Errorf("volume[0] items = %+v", got[0].ConfigMap.Items)
	}
	if got[1].Secret == nil || got[1].Secret.SecretName != "app-secret" {
		t.Errorf("volume[1] secret = %+v", got[1].Secret)
	}
	if got[2].EmptyDir == nil || got[2].EmptyDir.Medium != corev1.StorageMediumMemory {
		t.Errorf("volume[2] emptyDir = %+v", got[2].EmptyDir)
	}
	if got[2].EmptyDir.SizeLimit == nil || got[2].EmptyDir.SizeLimit.Cmp(resource.MustParse("1Gi")) != 0 {
		t.Errorf("volume[2] sizeLimit = %v, want 1Gi", got[2].EmptyDir.SizeLimit)
	}
	if got[3].PersistentVolumeClaim == nil || !got[3].PersistentVolumeClaim.ReadOnly {
		t.Errorf("volume[3] pvc = %+v", got[3].PersistentVolumeClaim)
	}
	if got[4].HostPath == nil || got[4].HostPath.Type == nil || *got[4].HostPath.Type != corev1.HostPathDirectory {
		t.Errorf("volume[4] hostPath = %+v", got[4].HostPath)
	}
}

func TestBuildVolumes_InvalidSizeLimit(t *testing.T) {
	_, err := BuildVolumes([]types.Volume{
		{Name: "scratch", EmptyDir: &types.EmptyDirVolumeSource{SizeLimit: "not-a-size"}},
	})
	if err == nil {
		t.Fatal("expected error for invalid emptyDir.sizeLimit, got nil")
	}
}

func TestBuildVolumeMounts(t *testing.T) {
	got := BuildVolumeMounts([]types.VolumeMount{
		{Name: "data", MountPath: "/data", SubPath: "sub", ReadOnly: true},
	})
	if len(got) != 1 {
		t.Fatalf("expected 1 mount, got %d", len(got))
	}
	if got[0].MountPath != "/data" || got[0].SubPath != "sub" || !got[0].ReadOnly {
		t.Errorf("unexpected mount: %+v", got[0])
	}
}

func TestBuildEnvFrom(t *testing.T) {
	got := BuildEnvFrom([]types.EnvFrom{
		{ConfigMapRef: "app-config", Prefix: "CFG_"},
		{SecretRef: "app-secret"},
	})
	if len(got) != 2 {
		t.Fatalf("expected 2 envFrom sources, got %d", len(got))
	}
	if got[0].ConfigMapRef == nil || got[0].ConfigMapRef.Name != "app-config" || got[0].Prefix != "CFG_" {
		t.Errorf("envFrom[0] = %+v", got[0])
	}
	if got[0].SecretRef != nil {
		t.Errorf("envFrom[0] should not set SecretRef, got %+v", got[0].SecretRef)
	}
	if got[1].SecretRef == nil || got[1].SecretRef.Name != "app-secret" {
		t.Errorf("envFrom[1] = %+v", got[1])
	}
}

func TestBuildImagePullSecrets(t *testing.T) {
	got := BuildImagePullSecrets([]string{"regcred", "ghcr"})
	if len(got) != 2 || got[0].Name != "regcred" || got[1].Name != "ghcr" {
		t.Errorf("unexpected pull secrets: %+v", got)
	}
}

func TestBuildDNSConfig(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if got := BuildDNSConfig(nil); got != nil {
			t.Errorf("expected nil, got %+v", got)
		}
	})

	t.Run("maps nameservers, searches, options", func(t *testing.T) {
		got := BuildDNSConfig(&types.DNSConfig{
			Nameservers: []string{"1.1.1.1"},
			Searches:    []string{"svc.cluster.local"},
			Options:     []types.DNSConfigOption{{Name: "ndots", Value: "5"}},
		})
		if len(got.Nameservers) != 1 || got.Nameservers[0] != "1.1.1.1" {
			t.Errorf("nameservers = %+v", got.Nameservers)
		}
		if len(got.Options) != 1 || got.Options[0].Name != "ndots" {
			t.Fatalf("options = %+v", got.Options)
		}
		if got.Options[0].Value == nil || *got.Options[0].Value != "5" {
			t.Errorf("option value = %v, want 5", got.Options[0].Value)
		}
	})
}

func TestBuildOverhead(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		got, err := BuildOverhead(nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != nil {
			t.Errorf("expected nil overhead, got %+v", got)
		}
	})

	t.Run("maps resource list", func(t *testing.T) {
		got, err := BuildOverhead(&types.ResourceList{CPU: "100m"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Cpu().Cmp(resource.MustParse("100m")) != 0 {
			t.Errorf("cpu overhead = %v, want 100m", got.Cpu())
		}
	})
}
