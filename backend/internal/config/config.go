package config

import "os"

type Config struct {
	Port       string
	LogLevel   string
	AppEnv     string
	Kubeconfig string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		Port:       port,
		LogLevel:   os.Getenv("LOG_LEVEL"),
		AppEnv:     os.Getenv("APP_ENV"),
		Kubeconfig: os.Getenv("KUBECONFIG"),
	}
}
