package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
)

type User struct {
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (s *Store) GetUser(ctx context.Context, username string) (*User, error) {
	row := s.db.QueryRowContext(ctx, s.rebind(
		`SELECT username, password_hash, role, created_at, updated_at FROM users WHERE username = ?`), username)
	var u User
	if err := row.Scan(&u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}
	return &u, nil
}

func (s *Store) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT username, password_hash, role, created_at, updated_at FROM users ORDER BY username`)
	if err != nil {
		return nil, fmt.Errorf("listing users: %w", err)
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning user: %w", err)
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("listing users: %w", err)
	}
	return users, nil
}

func (s *Store) CreateUser(ctx context.Context, username, passwordHash, role string) error {
	if _, err := s.GetUser(ctx, username); err == nil {
		return ErrUserAlreadyExists
	} else if !errors.Is(err, ErrUserNotFound) {
		return err
	}
	_, err := s.db.ExecContext(ctx, s.rebind(
		`INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`), username, passwordHash, role)
	if err != nil {
		return fmt.Errorf("creating user: %w", err)
	}
	return nil
}

func (s *Store) UpdateUser(ctx context.Context, username string, passwordHash, role *string) error {
	u, err := s.GetUser(ctx, username)
	if err != nil {
		return err
	}
	if passwordHash != nil {
		u.PasswordHash = *passwordHash
	}
	if role != nil {
		u.Role = *role
	}
	_, err = s.db.ExecContext(ctx, s.rebind(
		`UPDATE users SET password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?`),
		u.PasswordHash, u.Role, username)
	if err != nil {
		return fmt.Errorf("updating user: %w", err)
	}
	return nil
}

func (s *Store) DeleteUser(ctx context.Context, username string) error {
	res, err := s.db.ExecContext(ctx, s.rebind(`DELETE FROM users WHERE username = ?`), username)
	if err != nil {
		return fmt.Errorf("deleting user: %w", err)
	}
	if n, err := res.RowsAffected(); err == nil && n == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (s *Store) CountUsers(ctx context.Context) (int, error) {
	var n int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&n); err != nil {
		return 0, fmt.Errorf("counting users: %w", err)
	}
	return n, nil
}

// UpsertUser creates the user, or overwrites the password hash and role of an
// existing one. Used for users declared with a plaintext password in config,
// where the config file is the source of truth.
func (s *Store) UpsertUser(ctx context.Context, username, passwordHash, role string) error {
	err := s.CreateUser(ctx, username, passwordHash, role)
	if !errors.Is(err, ErrUserAlreadyExists) {
		return err
	}
	return s.UpdateUser(ctx, username, &passwordHash, &role)
}

// SeedUsers inserts users that do not exist yet; existing rows are never modified,
// so runtime password or role changes survive restarts.
func (s *Store) SeedUsers(ctx context.Context, users []User) (int, error) {
	created := 0
	for _, u := range users {
		err := s.CreateUser(ctx, u.Username, u.PasswordHash, u.Role)
		if errors.Is(err, ErrUserAlreadyExists) {
			continue
		}
		if err != nil {
			return created, fmt.Errorf("seeding user %s: %w", u.Username, err)
		}
		created++
	}
	return created, nil
}
