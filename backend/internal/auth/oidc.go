package auth

import (
	"context"
	"fmt"
	"sync"

	gooidc "github.com/coreos/go-oidc/v3/oidc"
)

type OIDCConfig struct {
	Issuer        string
	ClientID      string
	UsernameClaim string
	RolesClaim    string
	RoleMapping   map[string]Role
	DefaultRole   Role
}

type OIDCVerifier struct {
	cfg OIDCConfig

	mu       sync.Mutex
	verifier *gooidc.IDTokenVerifier
}

func NewOIDCVerifier(cfg OIDCConfig) (*OIDCVerifier, error) {
	if cfg.Issuer == "" || cfg.ClientID == "" {
		return nil, fmt.Errorf("oidc requires issuer and client_id")
	}
	if cfg.UsernameClaim == "" {
		cfg.UsernameClaim = "email"
	}
	if cfg.DefaultRole == "" {
		cfg.DefaultRole = RoleViewer
	}
	if !cfg.DefaultRole.AtLeast(RoleViewer) {
		return nil, fmt.Errorf("oidc default_role %q is invalid", cfg.DefaultRole)
	}
	for group, role := range cfg.RoleMapping {
		if !role.AtLeast(RoleViewer) {
			return nil, fmt.Errorf("oidc role_mapping for %q has invalid role %q", group, role)
		}
	}
	return &OIDCVerifier{cfg: cfg}, nil
}

func (v *OIDCVerifier) idTokenVerifier(ctx context.Context) (*gooidc.IDTokenVerifier, error) {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.verifier != nil {
		return v.verifier, nil
	}
	provider, err := gooidc.NewProvider(ctx, v.cfg.Issuer)
	if err != nil {
		return nil, fmt.Errorf("discovering oidc provider %s: %w", v.cfg.Issuer, err)
	}
	v.verifier = provider.Verifier(&gooidc.Config{ClientID: v.cfg.ClientID})
	return v.verifier, nil
}

func (v *OIDCVerifier) Verify(ctx context.Context, rawToken string) (*Identity, error) {
	verifier, err := v.idTokenVerifier(ctx)
	if err != nil {
		return nil, err
	}
	idToken, err := verifier.Verify(ctx, rawToken)
	if err != nil {
		return nil, fmt.Errorf("verifying oidc token: %w", err)
	}

	var claims map[string]any
	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("parsing oidc claims: %w", err)
	}

	username, _ := claims[v.cfg.UsernameClaim].(string)
	if username == "" {
		username = idToken.Subject
	}

	return &Identity{Username: username, Role: v.resolveRole(claims), Provider: "oidc"}, nil
}

func (v *OIDCVerifier) resolveRole(claims map[string]any) Role {
	if v.cfg.RolesClaim == "" || len(v.cfg.RoleMapping) == 0 {
		return v.cfg.DefaultRole
	}

	var groups []string
	switch val := claims[v.cfg.RolesClaim].(type) {
	case string:
		groups = []string{val}
	case []any:
		for _, g := range val {
			if s, ok := g.(string); ok {
				groups = append(groups, s)
			}
		}
	}

	best := v.cfg.DefaultRole
	matched := false
	for _, g := range groups {
		role, ok := v.cfg.RoleMapping[g]
		if !ok {
			continue
		}
		if !matched || role.AtLeast(best) {
			best = role
			matched = true
		}
	}
	return best
}
