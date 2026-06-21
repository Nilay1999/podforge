package util

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/podforge/backend/internal/types"
	"go.uber.org/zap"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/validation/field"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestCreateErrorResponse_StatusMapping(t *testing.T) {
	gr := schema.GroupResource{Resource: "pods"}
	gk := schema.GroupKind{Kind: "Pod"}

	tests := []struct {
		name       string
		err        error
		wantStatus int
	}{
		{
			name:       "validation error -> 400",
			err:        &types.ValidationError{Err: errors.New("bad input")},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "not found -> 404",
			err:        k8serrors.NewNotFound(gr, "nginx"),
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "already exists -> 409",
			err:        k8serrors.NewAlreadyExists(gr, "nginx"),
			wantStatus: http.StatusConflict,
		},
		{
			name:       "invalid -> 400",
			err:        k8serrors.NewInvalid(gk, "nginx", field.ErrorList{}),
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "unknown error -> 500",
			err:        errors.New("boom"),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			CreateErrorResponse(c, zap.NewNop(), tt.err)

			if w.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d (body: %s)", w.Code, tt.wantStatus, w.Body.String())
			}
		})
	}
}

func TestCreateErrorResponse_WrappedValidationError(t *testing.T) {
	// A ValidationError wrapped via fmt.Errorf must still resolve to 400 via errors.As.
	wrapped := &types.ValidationError{Err: errors.New("containers: invalid")}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	CreateErrorResponse(c, zap.NewNop(), wrapped)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestCreateErrorResponse_InternalErrorHidesDetail(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	CreateErrorResponse(c, zap.NewNop(), errors.New("sensitive internal detail"))

	if got := w.Body.String(); got == "" || strings.Contains(got, "sensitive internal detail") {
		t.Errorf("internal error body should not leak detail, got %q", got)
	}
}

func TestNormalizeList(t *testing.T) {
	t.Run("nil slice becomes empty non-nil slice", func(t *testing.T) {
		var s []string
		NormalizeList(&s)
		if s == nil {
			t.Fatal("expected non-nil slice after normalize")
		}
		if len(s) != 0 {
			t.Errorf("expected empty slice, got %v", s)
		}
	})

	t.Run("populated slice is left unchanged", func(t *testing.T) {
		s := []int{1, 2, 3}
		NormalizeList(&s)
		if len(s) != 3 {
			t.Errorf("expected slice unchanged, got %v", s)
		}
	})
}

func TestNormalizeList_MarshalsToArrayNotNull(t *testing.T) {
	// The point of NormalizeList: JSON-encode [] instead of null for empty lists.
	var s []string
	NormalizeList(&s)
	b, err := json.Marshal(s)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if string(b) != "[]" {
		t.Errorf("marshaled = %s, want []", b)
	}
}
