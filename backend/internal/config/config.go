package config

import (
	"os"
	"path/filepath"
	"time"

	"sigs.k8s.io/yaml"
)

type fileConfig struct {
	Server struct {
		Port     string `yaml:"port"`
		LogLevel string `yaml:"log_level"`
		Env      string `yaml:"env"`
	} `yaml:"server"`
	Kubernetes struct {
		Kubeconfig string `yaml:"kubeconfig"`
		Context    string `yaml:"context"`
	} `yaml:"kubernetes"`
	Auth struct {
		Enabled  *bool  `yaml:"enabled"`
		TokenTTL string `yaml:"token_ttl"`
		JWT      struct {
			Secret string `yaml:"secret"`
		} `yaml:"jwt"`
		Users []UserConfig `yaml:"users"`
		OIDC  struct {
			Enabled       bool              `yaml:"enabled"`
			Issuer        string            `yaml:"issuer"`
			ClientID      string            `yaml:"client_id"`
			UsernameClaim string            `yaml:"username_claim"`
			RolesClaim    string            `yaml:"roles_claim"`
			RoleMapping   map[string]string `yaml:"role_mapping"`
			DefaultRole   string            `yaml:"default_role"`
		} `yaml:"oidc"`
	} `yaml:"auth"`
}

type UserConfig struct {
	Username     string `yaml:"username"`
	PasswordHash string `yaml:"password_hash"`
	Role         string `yaml:"role"`
}

type OIDCConfig struct {
	Enabled       bool
	Issuer        string
	ClientID      string
	UsernameClaim string
	RolesClaim    string
	RoleMapping   map[string]string
	DefaultRole   string
}

type AuthConfig struct {
	Enabled   bool
	JWTSecret string
	TokenTTL  time.Duration
	Users     []UserConfig
	OIDC      OIDCConfig
}

type Config struct {
	Port        string
	LogLevel    string
	AppEnv      string
	Kubeconfig  string
	KubeContext string
	Auth        AuthConfig
}

func Load() Config {
	cfg := Config{
		Port: "8080",
		Auth: AuthConfig{Enabled: true, TokenTTL: 12 * time.Hour},
	}

	if fc, err := loadFile(); err == nil {
		cfg.Port = orDefault(fc.Server.Port, cfg.Port)
		cfg.LogLevel = fc.Server.LogLevel
		cfg.AppEnv = fc.Server.Env
		cfg.Kubeconfig = fc.Kubernetes.Kubeconfig
		cfg.KubeContext = fc.Kubernetes.Context

		if fc.Auth.Enabled != nil {
			cfg.Auth.Enabled = *fc.Auth.Enabled
		}
		if ttl, err := time.ParseDuration(fc.Auth.TokenTTL); err == nil && ttl > 0 {
			cfg.Auth.TokenTTL = ttl
		}
		cfg.Auth.JWTSecret = fc.Auth.JWT.Secret
		cfg.Auth.Users = fc.Auth.Users
		cfg.Auth.OIDC = OIDCConfig(fc.Auth.OIDC)
	}

	// env vars always override file values
	cfg.Port = orEnv("PORT", cfg.Port)
	cfg.LogLevel = orEnv("LOG_LEVEL", cfg.LogLevel)
	cfg.AppEnv = orEnv("APP_ENV", cfg.AppEnv)
	cfg.Kubeconfig = orEnv("KUBECONFIG", cfg.Kubeconfig)
	cfg.KubeContext = orEnv("KUBE_CONTEXT", cfg.KubeContext)

	if v := os.Getenv("AUTH_ENABLED"); v != "" {
		cfg.Auth.Enabled = v == "true" || v == "1"
	}
	cfg.Auth.JWTSecret = orEnv("AUTH_JWT_SECRET", cfg.Auth.JWTSecret)
	cfg.Auth.OIDC.Issuer = orEnv("OIDC_ISSUER", cfg.Auth.OIDC.Issuer)
	cfg.Auth.OIDC.ClientID = orEnv("OIDC_CLIENT_ID", cfg.Auth.OIDC.ClientID)
	if cfg.Auth.OIDC.Issuer != "" && os.Getenv("OIDC_ISSUER") != "" {
		cfg.Auth.OIDC.Enabled = true
	}

	return cfg
}

func loadFile() (fileConfig, error) {
	path := configFilePath()
	data, err := os.ReadFile(path)
	if err != nil {
		return fileConfig{}, err
	}
	var fc fileConfig
	if err := yaml.Unmarshal(data, &fc); err != nil {
		return fileConfig{}, err
	}
	return fc, nil
}

func configFilePath() string {
	if v := os.Getenv("CONFIG_FILE"); v != "" {
		return v
	}
	if _, err := os.Stat("podforge.yaml"); err == nil {
		return "podforge.yaml"
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".podforge", "config.yaml")
}

func orEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func orDefault(val, def string) string {
	if val != "" {
		return val
	}
	return def
}
