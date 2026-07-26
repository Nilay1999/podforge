package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {
	password, err := readPassword()
	if err != nil {
		fmt.Fprintf(os.Stderr, "reading password: %v\n", err)
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "hashing password: %v\n", err)
		os.Exit(1)
	}
	fmt.Println(string(hash))
}

// readPassword prompts on the terminal when stdin is interactive, and otherwise
// reads a single line from stdin so the password can be piped in (e.g. from
// scripts/setup.sh).
func readPassword() ([]byte, error) {
	if term.IsTerminal(int(os.Stdin.Fd())) {
		fmt.Fprint(os.Stderr, "Password: ")
		pw, err := term.ReadPassword(int(os.Stdin.Fd()))
		fmt.Fprintln(os.Stderr)
		return pw, err
	}

	line, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil && line == "" {
		return nil, err
	}
	return []byte(strings.TrimRight(line, "\r\n")), nil
}
