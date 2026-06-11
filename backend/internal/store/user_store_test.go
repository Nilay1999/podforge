package store

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(context.Background(), Options{SQLitePath: filepath.Join(t.TempDir(), "test.db")})
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestUserCRUD(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if err := s.CreateUser(ctx, "alice", "hash1", "admin"); err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	if err := s.CreateUser(ctx, "alice", "hash2", "viewer"); !errors.Is(err, ErrUserAlreadyExists) {
		t.Fatalf("expected ErrUserAlreadyExists, got %v", err)
	}

	u, err := s.GetUser(ctx, "alice")
	if err != nil {
		t.Fatalf("GetUser: %v", err)
	}
	if u.PasswordHash != "hash1" || u.Role != "admin" {
		t.Fatalf("unexpected user: %+v", u)
	}
	if _, err := s.GetUser(ctx, "nobody"); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}

	newRole := "editor"
	if err := s.UpdateUser(ctx, "alice", nil, &newRole); err != nil {
		t.Fatalf("UpdateUser: %v", err)
	}
	u, _ = s.GetUser(ctx, "alice")
	if u.Role != "editor" || u.PasswordHash != "hash1" {
		t.Fatalf("partial update wrong: %+v", u)
	}
	if err := s.UpdateUser(ctx, "nobody", nil, &newRole); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}

	users, err := s.ListUsers(ctx)
	if err != nil || len(users) != 1 {
		t.Fatalf("ListUsers: %v, %d users", err, len(users))
	}

	if err := s.DeleteUser(ctx, "alice"); err != nil {
		t.Fatalf("DeleteUser: %v", err)
	}
	if err := s.DeleteUser(ctx, "alice"); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}
}

func TestSeedUsersIsIdempotentAndNonDestructive(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	seed := []User{
		{Username: "a", PasswordHash: "h1", Role: "admin"},
		{Username: "b", PasswordHash: "h2", Role: "viewer"},
	}
	created, err := s.SeedUsers(ctx, seed)
	if err != nil || created != 2 {
		t.Fatalf("SeedUsers: %v, created %d", err, created)
	}

	newHash := "changed-at-runtime"
	if err := s.UpdateUser(ctx, "a", &newHash, nil); err != nil {
		t.Fatalf("UpdateUser: %v", err)
	}

	created, err = s.SeedUsers(ctx, seed)
	if err != nil || created != 0 {
		t.Fatalf("re-seed: %v, created %d", err, created)
	}
	u, _ := s.GetUser(ctx, "a")
	if u.PasswordHash != newHash {
		t.Fatal("seed overwrote a runtime password change")
	}

	if n, err := s.CountUsers(ctx); err != nil || n != 2 {
		t.Fatalf("CountUsers: %v, %d", err, n)
	}
}

func TestRebind(t *testing.T) {
	s := &Store{postgres: true}
	got := s.rebind(`INSERT INTO users (a, b, c) VALUES (?, ?, ?)`)
	want := `INSERT INTO users (a, b, c) VALUES ($1, $2, $3)`
	if got != want {
		t.Fatalf("rebind = %q, want %q", got, want)
	}

	s = &Store{postgres: false}
	if got := s.rebind(`SELECT ?`); got != `SELECT ?` {
		t.Fatalf("sqlite rebind should be a no-op, got %q", got)
	}
}
