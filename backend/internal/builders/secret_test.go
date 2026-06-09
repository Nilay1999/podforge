package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
)

func TestBuildSecret_DefaultsToOpaque(t *testing.T) {
	secret := BuildSecret(types.CreateSecretRequest{
		Name:      "creds",
		Namespace: "default",
	})
	if secret.Type != corev1.SecretTypeOpaque {
		t.Errorf("Type = %q, want Opaque", secret.Type)
	}
}

func TestBuildSecret_PreservesExplicitType(t *testing.T) {
	secret := BuildSecret(types.CreateSecretRequest{
		Name:      "tls",
		Namespace: "default",
		Type:      "kubernetes.io/tls",
	})
	if secret.Type != corev1.SecretType("kubernetes.io/tls") {
		t.Errorf("Type = %q, want kubernetes.io/tls", secret.Type)
	}
}

func TestBuildSecret_PassesThroughData(t *testing.T) {
	secret := BuildSecret(types.CreateSecretRequest{
		Name:       "creds",
		Namespace:  "default",
		StringData: map[string]string{"user": "admin"},
		Data:       map[string][]byte{"token": []byte("abc")},
	})
	if secret.StringData["user"] != "admin" {
		t.Errorf("StringData[user] = %q, want admin", secret.StringData["user"])
	}
	if string(secret.Data["token"]) != "abc" {
		t.Errorf("Data[token] = %q, want abc", secret.Data["token"])
	}
}
