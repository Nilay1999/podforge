package store

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS users (
	username      TEXT PRIMARY KEY,
	password_hash TEXT NOT NULL,
	role          TEXT NOT NULL,
	created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`

type Store struct {
	db       *sql.DB
	postgres bool
}

type Options struct {
	PostgresDSN string
	SQLitePath  string
}

func Open(ctx context.Context, opts Options) (*Store, error) {
	var db *sql.DB
	var err error
	postgres := opts.PostgresDSN != ""

	if postgres {
		db, err = sql.Open("pgx", opts.PostgresDSN)
	} else {
		path := opts.SQLitePath
		if path == "" {
			path = "podforge.db"
		}
		db, err = sql.Open("sqlite", path+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	}
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("connecting to database: %w", err)
	}

	s := &Store{db: db, postgres: postgres}
	if _, err := db.ExecContext(ctx, schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrating schema: %w", err)
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) Dialect() string {
	if s.postgres {
		return "postgres"
	}
	return "sqlite"
}

// rebind converts ? placeholders to $N for postgres.
func (s *Store) rebind(query string) string {
	if !s.postgres {
		return query
	}
	var b strings.Builder
	n := 0
	for _, ch := range query {
		if ch == '?' {
			n++
			b.WriteString("$" + strconv.Itoa(n))
			continue
		}
		b.WriteRune(ch)
	}
	return b.String()
}
