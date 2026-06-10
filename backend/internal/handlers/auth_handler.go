package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/podforge/backend/internal/auth"
	"github.com/podforge/backend/internal/middleware/authn"
)

type AuthHandler struct {
	local *auth.LocalAuthenticator
	oidc  *auth.OIDCVerifier
	log   *zap.Logger
}

func NewAuthHandler(local *auth.LocalAuthenticator, oidc *auth.OIDCVerifier, log *zap.Logger) *AuthHandler {
	return &AuthHandler{local: local, oidc: oidc, log: log}
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

	id, err := h.local.Login(req.Username, req.Password)
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
