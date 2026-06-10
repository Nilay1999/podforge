package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const testSecret = "0123456789abcdef0123456789abcdef"

func newTestAuthenticator(t *testing.T, ttl time.Duration) *LocalAuthenticator {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte("s3cret"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hashing password: %v", err)
	}
	a, err := NewLocalAuthenticator(testSecret, ttl, []User{
		{Username: "alice", PasswordHash: string(hash), Role: RoleAdmin},
	})
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

func TestNewLocalAuthenticatorRejectsInvalidRole(t *testing.T) {
	_, err := NewLocalAuthenticator(testSecret, time.Hour, []User{
		{Username: "bob", PasswordHash: "x", Role: Role("superuser")},
	})
	if err == nil {
		t.Fatal("expected error for invalid role")
	}
}

func TestLogin(t *testing.T) {
	a := newTestAuthenticator(t, time.Hour)

	id, err := a.Login("alice", "s3cret")
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if id.Username != "alice" || id.Role != RoleAdmin || id.Provider != "local" {
		t.Fatalf("unexpected identity: %+v", id)
	}

	if _, err := a.Login("alice", "wrong"); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
	if _, err := a.Login("mallory", "s3cret"); !errors.Is(err, ErrInvalidCredentials) {
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
