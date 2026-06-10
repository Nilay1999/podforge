package authn

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"

	"github.com/podforge/backend/internal/auth"
)

func newRouter(t *testing.T, role auth.Role) (*gin.Engine, string) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	hash, err := bcrypt.GenerateFromPassword([]byte("pw"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hashing password: %v", err)
	}
	local, err := auth.NewLocalAuthenticator("0123456789abcdef0123456789abcdef", time.Hour, []auth.User{
		{Username: "u", PasswordHash: string(hash), Role: role},
	})
	if err != nil {
		t.Fatalf("NewLocalAuthenticator: %v", err)
	}
	token, _, err := local.IssueToken(&auth.Identity{Username: "u", Role: role})
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}

	r := gin.New()
	r.Use(Authenticate(zap.NewNop(), local), RequireMethodRole())
	ok := func(c *gin.Context) { c.Status(http.StatusOK) }
	r.GET("/read", ok)
	r.POST("/write", ok)
	r.DELETE("/admin", RequireRole(auth.RoleAdmin), ok)
	return r, token
}

func request(r *gin.Engine, method, path, bearer, query string) int {
	url := path
	if query != "" {
		url += "?" + query
	}
	req := httptest.NewRequest(method, url, nil)
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w.Code
}

func TestMissingTokenIsUnauthorized(t *testing.T) {
	r, _ := newRouter(t, auth.RoleAdmin)
	if code := request(r, http.MethodGet, "/read", "", ""); code != http.StatusUnauthorized {
		t.Fatalf("got %d, want 401", code)
	}
}

func TestGarbageTokenIsUnauthorized(t *testing.T) {
	r, _ := newRouter(t, auth.RoleAdmin)
	if code := request(r, http.MethodGet, "/read", "not-a-jwt", ""); code != http.StatusUnauthorized {
		t.Fatalf("got %d, want 401", code)
	}
}

func TestTokenViaQueryParamForSSE(t *testing.T) {
	r, token := newRouter(t, auth.RoleViewer)
	if code := request(r, http.MethodGet, "/read", "", "token="+token); code != http.StatusOK {
		t.Fatalf("got %d, want 200", code)
	}
}

func TestViewerCanReadButNotWrite(t *testing.T) {
	r, token := newRouter(t, auth.RoleViewer)
	if code := request(r, http.MethodGet, "/read", token, ""); code != http.StatusOK {
		t.Fatalf("read: got %d, want 200", code)
	}
	if code := request(r, http.MethodPost, "/write", token, ""); code != http.StatusForbidden {
		t.Fatalf("write: got %d, want 403", code)
	}
}

func TestEditorCanWriteButNotAdmin(t *testing.T) {
	r, token := newRouter(t, auth.RoleEditor)
	if code := request(r, http.MethodPost, "/write", token, ""); code != http.StatusOK {
		t.Fatalf("write: got %d, want 200", code)
	}
	if code := request(r, http.MethodDelete, "/admin", token, ""); code != http.StatusForbidden {
		t.Fatalf("admin: got %d, want 403", code)
	}
}

func TestAdminCanDoEverything(t *testing.T) {
	r, token := newRouter(t, auth.RoleAdmin)
	for _, tc := range []struct{ method, path string }{
		{http.MethodGet, "/read"},
		{http.MethodPost, "/write"},
		{http.MethodDelete, "/admin"},
	} {
		if code := request(r, tc.method, tc.path, token, ""); code != http.StatusOK {
			t.Fatalf("%s %s: got %d, want 200", tc.method, tc.path, code)
		}
	}
}
