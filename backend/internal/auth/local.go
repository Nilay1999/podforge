package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid username or password")

type User struct {
	Username     string
	PasswordHash string
	Role         Role
}

type LocalAuthenticator struct {
	secret    []byte
	tokenTTL  time.Duration
	users     map[string]User
	dummyHash []byte
}

func NewLocalAuthenticator(secret string, tokenTTL time.Duration, users []User) (*LocalAuthenticator, error) {
	if len(secret) < 32 {
		return nil, fmt.Errorf("jwt secret must be at least 32 characters, got %d", len(secret))
	}
	byName := make(map[string]User, len(users))
	for _, u := range users {
		if u.Username == "" || u.PasswordHash == "" {
			return nil, fmt.Errorf("user entry missing username or password_hash")
		}
		if !u.Role.AtLeast(RoleViewer) {
			return nil, fmt.Errorf("user %q has invalid role %q", u.Username, u.Role)
		}
		byName[u.Username] = u
	}
	dummyHash, err := bcrypt.GenerateFromPassword([]byte("podforge-dummy"), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("generating dummy hash: %w", err)
	}
	return &LocalAuthenticator{secret: []byte(secret), tokenTTL: tokenTTL, users: byName, dummyHash: dummyHash}, nil
}

func (a *LocalAuthenticator) Login(username, password string) (*Identity, error) {
	u, ok := a.users[username]
	if !ok {
		// equalize timing so unknown usernames are indistinguishable from bad passwords
		bcrypt.CompareHashAndPassword(a.dummyHash, []byte(password))
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return &Identity{Username: u.Username, Role: u.Role, Provider: "local"}, nil
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
