package main

import (
	"embed"
	"log"
	"os"
	"strings"
)

//go:embed seed/*.json
var seedFS embed.FS

func main() {
	loadDotEnv()

	db, err := OpenDB()
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	store := &Store{db: db, snapp: NewSnapp()}
	if err := store.AutoMigrate(); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := SeedIfEmpty(store, seedFS); err != nil {
		log.Fatalf("seed: %v", err)
	}
	if err := EnsureRecipeImages(store); err != nil {
		log.Fatalf("recipe images: %v", err)
	}
	if err := EnsureUserLevels(store); err != nil {
		log.Fatalf("user levels: %v", err)
	}

	addr := ":8080"
	if v := os.Getenv("PORT"); v != "" {
		addr = ":" + v
	} else if v := os.Getenv("COOKIFY_PORT"); v != "" {
		addr = ":" + v
	}

	api := &API{store: store}
	api.cookScheduler().Start()

	r := NewRouter(store)
	log.Printf("cookify api listening on http://localhost%s (gin + gorm + postgres)", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func loadDotEnv() {
	b, err := os.ReadFile(".env")
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(b), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.Trim(strings.TrimSpace(v), `"'`)
		if os.Getenv(k) == "" {
			_ = os.Setenv(k, v)
		}
	}
}
