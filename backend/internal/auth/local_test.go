package auth

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/podforge/backend/internal/store"
)

const testSecret = "0123456789abcdef0123456789abcdef"

func newTestAuthenticator(t *testing.T, ttl time.Duration) *LocalAuthenticator {
	t.Helper()
	s, err := store.Open(context.Background(), store.Options{
		SQLitePath: filepath.Join(t.TempDir(), "test.db"),
	})
	if err != nil {
		t.Fatalf("opening store: %v", err)
	}
	t.Cleanup(func() { s.Close() })

	hash, err := bcrypt.GenerateFromPassword([]byte("s3cret"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hashing password: %v", err)
	}
	if err := s.CreateUser(context.Background(), "alice", string(hash), string(RoleAdmin)); err != nil {
		t.Fatalf("creating user: %v", err)
	}

	a, err := NewLocalAuthenticator(testSecret, ttl, s)
	if err != nil {
		t.Fatalf("NewLocalAuthenticator: %v", err)
	}
	return a
}

func TestNewLocalAuthenticatorRejectsShortSecret(t *testing.T) {
	if _, err := NewLocalAuthenticator("short", time.Hour, nil); err == nil {
		t.Fatal("expected error for short secret")
	}
}

func TestLogin(t *testing.T) {
	a := newTestAuthenticator(t, time.Hour)
	ctx := context.Background()

	id, err := a.Login(ctx, "alice", "s3cret")
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if id.Username != "alice" || id.Role != RoleAdmin || id.Provider != "local" {
		t.Fatalf("unexpected identity: %+v", id)
	}

	if _, err := a.Login(ctx, "alice", "wrong"); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
	if _, err := a.Login(ctx, "mallory", "s3cret"); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials for unknown user, got %v", err)
	}
}

func TestIssueAndVerifyToken(t *testing.T) {
	a := newTestAuthenticator(t, time.Hour)

	token, expiresAt, err := a.IssueToken(&Identity{Username: "alice", Role: RoleAdmin})
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}
	if time.Until(expiresAt) <= 0 {
		t.Fatal("token already expired")
	}

	id, err := a.Verify(context.Background(), token)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if id.Username != "alice" || id.Role != RoleAdmin {
		t.Fatalf("unexpected identity: %+v", id)
	}
}

func TestVerifyRejectsExpiredToken(t *testing.T) {
	a := newTestAuthenticator(t, -time.Minute)

	token, _, err := a.IssueToken(&Identity{Username: "alice", Role: RoleAdmin})
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}
	if _, err := a.Verify(context.Background(), token); err == nil {
		t.Fatal("expected error for expired token")
	}
}

func TestVerifyRejectsTamperedToken(t *testing.T) {
	a := newTestAuthenticator(t, time.Hour)
	other := newTestAuthenticator(t, time.Hour)
	other.secret = []byte("ffffffffffffffffffffffffffffffff")

	token, _, err := other.IssueToken(&Identity{Username: "alice", Role: RoleAdmin})
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}
	if _, err := a.Verify(context.Background(), token); err == nil {
		t.Fatal("expected error for token signed with different secret")
	}
}

func TestRoleAtLeast(t *testing.T) {
	cases := []struct {
		role, min Role
		want      bool
	}{
		{RoleViewer, RoleViewer, true},
		{RoleViewer, RoleEditor, false},
		{RoleEditor, RoleViewer, true},
		{RoleEditor, RoleAdmin, false},
		{RoleAdmin, RoleEditor, true},
		{Role("bogus"), RoleViewer, false},
	}
	for _, tc := range cases {
		if got := tc.role.AtLeast(tc.min); got != tc.want {
			t.Errorf("%s.AtLeast(%s) = %v, want %v", tc.role, tc.min, got, tc.want)
		}
	}
}
