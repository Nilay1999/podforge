package config

import (
	"os"
	"path/filepath"

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
}

type Config struct {
	Port        string
	LogLevel    string
	AppEnv      string
	Kubeconfig  string
	KubeContext string
}

func Load() Config {
	cfg := Config{Port: "8080"}

	if fc, err := loadFile(); err == nil {
		cfg.Port = orDefault(fc.Server.Port, cfg.Port)
		cfg.LogLevel = fc.Server.LogLevel
		cfg.AppEnv = fc.Server.Env
		cfg.Kubeconfig = fc.Kubernetes.Kubeconfig
		cfg.KubeContext = fc.Kubernetes.Context
	}

	// env vars always override file values
	cfg.Port = orEnv("PORT", cfg.Port)
	cfg.LogLevel = orEnv("LOG_LEVEL", cfg.LogLevel)
	cfg.AppEnv = orEnv("APP_ENV", cfg.AppEnv)
	cfg.Kubeconfig = orEnv("KUBECONFIG", cfg.Kubeconfig)
	cfg.KubeContext = orEnv("KUBE_CONTEXT", cfg.KubeContext)

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
