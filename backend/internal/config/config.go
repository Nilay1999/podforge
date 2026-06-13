package config

import (
	"os"
	"path/filepath"
	"time"

	"sigs.k8s.io/yaml"
)

type fileConfig struct {
	Server struct {
		Port     string `yaml:"port" json:"port"`
		LogLevel string `yaml:"log_level" json:"log_level"`
		Env      string `yaml:"env" json:"env"`
	} `yaml:"server" json:"server"`
	Kubernetes struct {
		Kubeconfig string `yaml:"kubeconfig" json:"kubeconfig"`
		Context    string `yaml:"context" json:"context"`
	} `yaml:"kubernetes" json:"kubernetes"`
	Database struct {
		Postgres struct {
			DSN      string `yaml:"dsn" json:"dsn"`
			Host     string `yaml:"host" json:"host"`
			Port     string `yaml:"port" json:"port"`
			User     string `yaml:"user" json:"user"`
			Password string `yaml:"password" json:"password"`
			DBName   string `yaml:"dbname" json:"dbname"`
			SSLMode  string `yaml:"sslmode" json:"sslmode"`
		} `yaml:"postgres" json:"postgres"`
		SQLite struct {
			Path string `yaml:"path" json:"path"`
		} `yaml:"sqlite" json:"sqlite"`
	} `yaml:"database" json:"database"`
	Auth struct {
		Enabled  *bool  `yaml:"enabled" json:"enabled"`
		TokenTTL string `yaml:"token_ttl" json:"token_ttl"`
		JWT      struct {
			Secret string `yaml:"secret" json:"secret"`
		} `yaml:"jwt" json:"jwt"`
		Users []UserConfig `yaml:"users" json:"users"`
		OIDC  struct {
			Enabled        bool              `yaml:"enabled" json:"enabled"`
			Issuer         string            `yaml:"issuer" json:"issuer"`
			ClientID       string            `yaml:"client_id" json:"client_id"`
			UsernameClaim  string            `yaml:"username_claim" json:"username_claim"`
			RolesClaim     string            `yaml:"roles_claim" json:"roles_claim"`
			RoleMapping    map[string]string `yaml:"role_mapping" json:"role_mapping"`
			DefaultRole    string            `yaml:"default_role" json:"default_role"`
			AllowedDomains []string          `yaml:"allowed_domains" json:"allowed_domains"`
		} `yaml:"oidc" json:"oidc"`
	} `yaml:"auth" json:"auth"`
}

type UserConfig struct {
	Username     string `yaml:"username" json:"username"`
	PasswordHash string `yaml:"password_hash" json:"password_hash"`
	Role         string `yaml:"role" json:"role"`
}

type OIDCConfig struct {
	Enabled        bool
	Issuer         string
	ClientID       string
	UsernameClaim  string
	RolesClaim     string
	RoleMapping    map[string]string
	DefaultRole    string
	AllowedDomains []string
}

type DatabaseConfig struct {
	// PostgresDSN non-empty means use Postgres; otherwise SQLite at SQLitePath.
	PostgresDSN string
	SQLitePath  string
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
	Database    DatabaseConfig
	Auth        AuthConfig
}

func Load() Config {
	cfg := Config{
		Port:     "8080",
		Database: DatabaseConfig{SQLitePath: "podforge.db"},
		Auth:     AuthConfig{Enabled: true, TokenTTL: 12 * time.Hour},
	}

	if fc, err := loadFile(); err == nil {
		cfg.Database.PostgresDSN = postgresDSN(fc)
		cfg.Database.SQLitePath = orDefault(fc.Database.SQLite.Path, cfg.Database.SQLitePath)
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

	cfg.Database.PostgresDSN = orEnv("DATABASE_URL", cfg.Database.PostgresDSN)
	cfg.Database.SQLitePath = orEnv("SQLITE_PATH", cfg.Database.SQLitePath)

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

func postgresDSN(fc fileConfig) string {
	pg := fc.Database.Postgres
	if pg.DSN != "" {
		return pg.DSN
	}
	if pg.Host == "" {
		return ""
	}
	dsn := "host=" + pg.Host
	for _, kv := range [][2]string{
		{"port", pg.Port},
		{"user", pg.User},
		{"password", pg.Password},
		{"dbname", pg.DBName},
		{"sslmode", pg.SSLMode},
	} {
		if kv[1] != "" {
			dsn += " " + kv[0] + "=" + kv[1]
		}
	}
	return dsn
}

func loadFile() (fileConfig, error) {
	path := configFilePath()
	data, err := os.ReadFile(path)
	if err != nil {
		return fileConfig{}, err
	}
	var fc fileConfig
	if err := unmarshalConfig(data, &fc); err != nil {
		return fileConfig{}, err
	}
	return fc, nil
}

func unmarshalConfig(data []byte, fc *fileConfig) error {
	return yaml.Unmarshal(data, fc)
}

func configFilePath() string {
	if v := os.Getenv("CONFIG_FILE"); v != "" {
		return v
	}
	if _, err := os.Stat("config.yaml"); err == nil {
		return "config.yaml"
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
