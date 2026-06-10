package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
)

func TestBuildConfigmap_MapsFields(t *testing.T) {
	immutable := true
	cm := BuildConfigmap(types.CreateConfigmapRequest{
		Name:        "app-config",
		Namespace:   "default",
		Labels:      map[string]string{"app": "web"},
		Annotations: map[string]string{"owner": "team-a"},
		Data:        map[string]string{"LOG_LEVEL": "info"},
		BinaryData:  map[string][]byte{"cert": []byte("xyz")},
		Immutable:   &immutable,
	})

	if cm.Name != "app-config" || cm.Namespace != "default" {
		t.Errorf("metadata = %q/%q, want app-config/default", cm.Name, cm.Namespace)
	}
	if cm.Labels["app"] != "web" {
		t.Errorf("Labels[app] = %q, want web", cm.Labels["app"])
	}
	if cm.Annotations["owner"] != "team-a" {
		t.Errorf("Annotations[owner] = %q, want team-a", cm.Annotations["owner"])
	}
	if cm.Data["LOG_LEVEL"] != "info" {
		t.Errorf("Data[LOG_LEVEL] = %q, want info", cm.Data["LOG_LEVEL"])
	}
	if string(cm.BinaryData["cert"]) != "xyz" {
		t.Errorf("BinaryData[cert] = %q, want xyz", cm.BinaryData["cert"])
	}
	if cm.Immutable == nil || !*cm.Immutable {
		t.Errorf("Immutable = %v, want true", cm.Immutable)
	}
}
