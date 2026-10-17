package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

func ntfyBaseURL() string {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("NTFY_BASE_URL")), "/")
	if base == "" {
		base = "https://ntfy.sh"
	}
	return base
}

func ntfyEnabled() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("NTFY_ENABLED")))
	if v == "0" || v == "false" || v == "off" {
		return false
	}
	return true
}

func publishNtfy(topic, title, body, tags string) error {
	topic = strings.TrimSpace(topic)
	if topic == "" {
		return fmt.Errorf("empty ntfy topic")
	}
	if !ntfyEnabled() {
		log.Printf("ntfy skipped (disabled): %s — %s", title, body)
		return nil
	}

	url := ntfyBaseURL() + "/" + topic
	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Title", title)
	req.Header.Set("Content-Type", "text/plain; charset=utf-8")
	if tags != "" {
		req.Header.Set("Tags", tags)
	}
	req.Header.Set("Priority", "high")
	if lang := strings.TrimSpace(os.Getenv("NTFY_LANG")); lang != "" {
		req.Header.Set("Accept-Language", lang)
	}

	client := &http.Client{Timeout: 8 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return fmt.Errorf("ntfy status %d", res.StatusCode)
	}
	return nil
}
