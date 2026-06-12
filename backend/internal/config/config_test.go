package config

import "testing"

func TestLoadQuotedBcryptHashFromYAML(t *testing.T) {
	data := []byte(`
auth:
  users:
    - username: nilay
      password_hash: '$2a$10$Vl.ui6W33exiyiv53AtSauO/QLdi.qMyywnzdQLKdoaO9cUoKiGzK'
      role: admin
`)

	var fc fileConfig
	if err := unmarshalConfig(data, &fc); err != nil {
		t.Fatalf("unmarshalConfig: %v", err)
	}
	if len(fc.Auth.Users) != 1 {
		t.Fatalf("users len = %d, want 1", len(fc.Auth.Users))
	}
	got := fc.Auth.Users[0].PasswordHash
	want := "$2a$10$Vl.ui6W33exiyiv53AtSauO/QLdi.qMyywnzdQLKdoaO9cUoKiGzK"
	if got != want {
		t.Fatalf("password_hash = %q, want %q", got, want)
	}
}
