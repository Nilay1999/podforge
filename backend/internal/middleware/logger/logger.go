package logger

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nilay/k8s-orchestrator/backend/internal/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func New(cfg config.Config) *zap.Logger {
	level := parseLevel(cfg.LogLevel)

	var c zap.Config
	if cfg.AppEnv == "production" {
		c = zap.NewProductionConfig()
	} else {
		c = zap.NewDevelopmentConfig()
		c.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	c.Level = zap.NewAtomicLevelAt(level)

	log, err := c.Build(zap.AddCallerSkip(0))
	if err != nil {
		panic("logger init failed: " + err.Error())
	}

	return log
}

func GinMiddleware(log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		if raw := c.Request.URL.RawQuery; raw != "" {
			path += "?" + raw
		}

		c.Next()

		status := c.Writer.Status()
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.Int("status", status),
			zap.Duration("latency", time.Since(start)),
			zap.String("ip", c.ClientIP()),
			zap.Int("bytes", c.Writer.Size()),
		}

		switch {
		case status >= 500:
			log.Error("request", fields...)
		case status >= 400:
			log.Warn("request", fields...)
		default:
			log.Info("request", fields...)
		}
	}
}

func parseLevel(s string) zapcore.Level {
	switch s {
	case "debug":
		return zapcore.DebugLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}
