.PHONY: run-backend build test tidy

BACKEND_DIR := backend
BIN_DIR := $(BACKEND_DIR)/bin
BINARY := $(BIN_DIR)/server

run-backend:
	cd $(BACKEND_DIR) && go run ./cmd/server

build:
	mkdir -p $(BIN_DIR)
	cd $(BACKEND_DIR) && go build -o bin/server ./cmd/server

test:
	cd $(BACKEND_DIR) && go test ./...

tidy:
	cd $(BACKEND_DIR) && go mod tidy
