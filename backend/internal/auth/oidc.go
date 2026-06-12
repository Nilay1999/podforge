package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	gooidc "github.com/coreos/go-oidc/v3/oidc"
)

// ErrAccessDenied means the token is cryptographically valid but the identity is
// not allowed in: its email domain is not on the allowlist, or it belongs to no
// mapped group while no default role is configured. Distinct from a verification
// failure so callers can tell an untrusted token from a trusted-but-unauthorized
// one.
var ErrAccessDenied = errors.New("access denied")

type OIDCConfig struct {
	Issuer        string
	ClientID      string
	UsernameClaim string
	RolesClaim    string
	RoleMapping   map[string]Role
	// DefaultRole is granted to authenticated users who match no mapped group.
	// When empty, such users are rejected (group-gated access): only members of
	// a mapped group can log in.
	DefaultRole Role
	// AllowedDomains, when non-empty, restricts login to identities whose
	// username/email is on one of these domains (e.g. "yourorg.com").
	AllowedDomains []string
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
	// With no role_mapping there is nothing to gate on, so an omitted default_role
	// falls back to viewer (open access, the original behavior). When a role_mapping
	// IS configured, leaving default_role empty turns on group-gating: only members
	// of a mapped group are admitted; everyone else is denied.
	if cfg.DefaultRole == "" && len(cfg.RoleMapping) == 0 {
		cfg.DefaultRole = RoleViewer
	}
	if cfg.DefaultRole != "" && !cfg.DefaultRole.AtLeast(RoleViewer) {
		return nil, fmt.Errorf("oidc default_role %q is invalid", cfg.DefaultRole)
	}
	for group, role := range cfg.RoleMapping {
		if !role.AtLeast(RoleViewer) {
			return nil, fmt.Errorf("oidc role_mapping for %q has invalid role %q", group, role)
		}
	}
	cfg.AllowedDomains = normalizeDomains(cfg.AllowedDomains)
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

	if !v.domainAllowed(username) {
		return nil, fmt.Errorf("%w: %q is not on an allowed domain", ErrAccessDenied, username)
	}

	role := v.resolveRole(claims)
	if role == "" {
		return nil, fmt.Errorf("%w: %q is not a member of any mapped group", ErrAccessDenied, username)
	}

	return &Identity{Username: username, Role: role, Provider: "oidc"}, nil
}

// domainAllowed reports whether the username/email belongs to a permitted
// domain. With no AllowedDomains configured every domain is permitted.
func (v *OIDCVerifier) domainAllowed(username string) bool {
	if len(v.cfg.AllowedDomains) == 0 {
		return true
	}
	at := strings.LastIndex(username, "@")
	if at < 0 {
		return false
	}
	domain := strings.ToLower(username[at+1:])
	for _, d := range v.cfg.AllowedDomains {
		if d == domain {
			return true
		}
	}
	return false
}

// resolveRole returns the role for the token, or "" when the user matches no
// mapped group and no default role is configured (group-gated denial).
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

func normalizeDomains(domains []string) []string {
	out := make([]string, 0, len(domains))
	for _, d := range domains {
		if d = strings.ToLower(strings.TrimSpace(d)); d != "" {
			out = append(out, d)
		}
	}
	return out
}
