package auth

import (
	"context"
	"fmt"
)

type Role string

const (
	RoleViewer Role = "viewer"
	RoleEditor Role = "editor"
	RoleAdmin  Role = "admin"
)

var roleRank = map[Role]int{
	RoleViewer: 1,
	RoleEditor: 2,
	RoleAdmin:  3,
}

func ParseRole(s string) (Role, error) {
	r := Role(s)
	if _, ok := roleRank[r]; !ok {
		return "", fmt.Errorf("unknown role %q", s)
	}
	return r, nil
}

func (r Role) AtLeast(min Role) bool {
	return roleRank[r] >= roleRank[min]
}

type Identity struct {
	Username string `json:"username"`
	Role     Role   `json:"role"`
	Provider string `json:"provider"`
}

type Verifier interface {
	Verify(ctx context.Context, rawToken string) (*Identity, error)
}
