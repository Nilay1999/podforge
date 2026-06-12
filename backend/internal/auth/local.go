package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/podforge/backend/internal/store"
)

var ErrInvalidCredentials = errors.New("invalid username or password")

type UserStore interface {
	GetUser(ctx context.Context, username string) (*store.User, error)
}

type LocalAuthenticator struct {
	secret    []byte
	tokenTTL  time.Duration
	users     UserStore
	dummyHash []byte
}

func NewLocalAuthenticator(secret string, tokenTTL time.Duration, users UserStore) (*LocalAuthenticator, error) {
	if len(secret) < 32 {
		return nil, fmt.Errorf("jwt secret must be at least 32 characters, got %d", len(secret))
	}
	dummyHash, err := bcrypt.GenerateFromPassword([]byte("podforge-dummy"), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("generating dummy hash: %w", err)
	}
	return &LocalAuthenticator{secret: []byte(secret), tokenTTL: tokenTTL, users: users, dummyHash: dummyHash}, nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hashing password: %w", err)
	}
	return string(hash), nil
}

func ValidatePasswordHash(hash string) error {
	if _, err := bcrypt.Cost([]byte(hash)); err != nil {
		return fmt.Errorf("invalid bcrypt password hash: %w", err)
	}
	return nil
}

func (a *LocalAuthenticator) Login(ctx context.Context, username, password string) (*Identity, error) {
	u, err := a.users.GetUser(ctx, username)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			// equalize timing so unknown usernames are indistinguishable from bad passwords
			bcrypt.CompareHashAndPassword(a.dummyHash, []byte(password))
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("looking up user: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	role, err := ParseRole(u.Role)
	if err != nil {
		return nil, fmt.Errorf("user %s: %w", username, err)
	}
	return &Identity{Username: u.Username, Role: role, Provider: "local"}, nil
}

type localClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func (a *LocalAuthenticator) IssueToken(id *Identity) (string, time.Time, error) {
	expiresAt := time.Now().Add(a.tokenTTL)
	claims := localClaims{
		Role: string(id.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   id.Username,
			Issuer:    "podforge",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(a.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("signing token: %w", err)
	}
	return token, expiresAt, nil
}

func (a *LocalAuthenticator) Verify(_ context.Context, rawToken string) (*Identity, error) {
	var claims localClaims
	_, err := jwt.ParseWithClaims(rawToken, &claims, func(t *jwt.Token) (any, error) {
		return a.secret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithIssuer("podforge"), jwt.WithExpirationRequired())
	if err != nil {
		return nil, fmt.Errorf("verifying token: %w", err)
	}
	role, err := ParseRole(claims.Role)
	if err != nil {
		return nil, fmt.Errorf("verifying token: %w", err)
	}
	return &Identity{Username: claims.Subject, Role: role, Provider: "local"}, nil
}
