package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/auth"
	"github.com/podforge/backend/internal/middleware/authn"
	"github.com/podforge/backend/internal/store"
)

type AuthHandler struct {
	local *auth.LocalAuthenticator
	oidc  *auth.OIDCVerifier
	users *store.Store
	log   *zap.Logger
}

func NewAuthHandler(local *auth.LocalAuthenticator, oidc *auth.OIDCVerifier, users *store.Store, log *zap.Logger) *AuthHandler {
	return &AuthHandler{local: local, oidc: oidc, users: users, log: log}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	Token     string        `json:"token"`
	ExpiresAt time.Time     `json:"expiresAt"`
	User      auth.Identity `json:"user"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	if h.local == nil {
		c.JSON(http.StatusNotImplemented, gin.H{"error": "local login is not configured"})
		return
	}

	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.local.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		h.log.Error("login failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	token, expiresAt, err := h.local.IssueToken(id)
	if err != nil {
		h.log.Error("issuing token failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, loginResponse{Token: token, ExpiresAt: expiresAt, User: *id})
}

func (h *AuthHandler) Me(c *gin.Context) {
	id := authn.IdentityFrom(c)
	if id == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
		return
	}
	c.JSON(http.StatusOK, id)
}

type createUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required"`
}

type updateUserRequest struct {
	Password *string `json:"password" binding:"omitempty,min=8"`
	Role     *string `json:"role"`
}

func (h *AuthHandler) ListUsers(c *gin.Context) {
	users, err := h.users.ListUsers(c.Request.Context())
	if err != nil {
		h.log.Error("listing users failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *AuthHandler) CreateUser(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	role, err := auth.ParseRole(req.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		h.log.Error("hashing password failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if err := h.users.CreateUser(c.Request.Context(), req.Username, hash, string(role)); err != nil {
		if errors.Is(err, store.ErrUserAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		h.log.Error("creating user failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"username": req.Username, "role": string(role), "status": "created"})
}

func (h *AuthHandler) UpdateUser(c *gin.Context) {
	username := c.Param("username")

	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Password == nil && req.Role == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nothing to update; provide password and/or role"})
		return
	}

	var hash *string
	if req.Password != nil {
		hashed, err := auth.HashPassword(*req.Password)
		if err != nil {
			h.log.Error("hashing password failed", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		hash = &hashed
	}
	if req.Role != nil {
		if _, err := auth.ParseRole(*req.Role); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if id := authn.IdentityFrom(c); id != nil && id.Username == username && *req.Role != string(id.Role) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot change your own role"})
			return
		}
	}

	if err := h.users.UpdateUser(c.Request.Context(), username, hash, req.Role); err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		h.log.Error("updating user failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"username": username, "status": "updated"})
}

func (h *AuthHandler) DeleteUser(c *gin.Context) {
	username := c.Param("username")

	if id := authn.IdentityFrom(c); id != nil && id.Username == username {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete your own account"})
		return
	}

	if err := h.users.DeleteUser(c.Request.Context(), username); err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		h.log.Error("deleting user failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"username": username, "status": "deleted"})
}

type providersResponse struct {
	AuthEnabled bool          `json:"authEnabled"`
	Local       bool          `json:"local"`
	OIDC        *oidcProvider `json:"oidc,omitempty"`
}

type oidcProvider struct {
	Issuer   string `json:"issuer"`
	ClientID string `json:"clientId"`
}

func (h *AuthHandler) Providers(issuer, clientID string, authEnabled bool) gin.HandlerFunc {
	resp := providersResponse{AuthEnabled: authEnabled, Local: h.local != nil}
	if h.oidc != nil {
		resp.OIDC = &oidcProvider{Issuer: issuer, ClientID: clientID}
	}
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, resp)
	}
}
