package auth

import "testing"

func TestNewOIDCVerifierValidation(t *testing.T) {
	if _, err := NewOIDCVerifier(OIDCConfig{}); err == nil {
		t.Fatal("expected error when issuer and client_id are missing")
	}
	if _, err := NewOIDCVerifier(OIDCConfig{Issuer: "https://idp", ClientID: "podforge", DefaultRole: Role("bogus")}); err == nil {
		t.Fatal("expected error for invalid default role")
	}
	v, err := NewOIDCVerifier(OIDCConfig{Issuer: "https://idp", ClientID: "podforge"})
	if err != nil {
		t.Fatalf("NewOIDCVerifier: %v", err)
	}
	if v.cfg.DefaultRole != RoleViewer {
		t.Fatalf("default role = %s, want viewer", v.cfg.DefaultRole)
	}
	if v.cfg.UsernameClaim != "email" {
		t.Fatalf("username claim = %s, want email", v.cfg.UsernameClaim)
	}
}

func TestResolveRole(t *testing.T) {
	v, err := NewOIDCVerifier(OIDCConfig{
		Issuer:     "https://idp",
		ClientID:   "podforge",
		RolesClaim: "groups",
		RoleMapping: map[string]Role{
			"podforge-admins":  RoleAdmin,
			"podforge-editors": RoleEditor,
		},
		DefaultRole: RoleViewer,
	})
	if err != nil {
		t.Fatalf("NewOIDCVerifier: %v", err)
	}

	cases := []struct {
		name   string
		claims map[string]any
		want   Role
	}{
		{"no groups claim", map[string]any{}, RoleViewer},
		{"unmapped group", map[string]any{"groups": []any{"devs"}}, RoleViewer},
		{"editor group", map[string]any{"groups": []any{"podforge-editors"}}, RoleEditor},
		{"highest of multiple", map[string]any{"groups": []any{"podforge-editors", "podforge-admins"}}, RoleAdmin},
		{"string claim", map[string]any{"groups": "podforge-admins"}, RoleAdmin},
	}
	for _, tc := range cases {
		if got := v.resolveRole(tc.claims); got != tc.want {
			t.Errorf("%s: resolveRole = %s, want %s", tc.name, got, tc.want)
		}
	}
}
