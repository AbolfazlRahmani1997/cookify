package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"
)

func analyticsURL() string {
	raw := strings.TrimRight(os.Getenv("COOKIFY_ANALYTICS_URL"), "/")
	if raw == "" {
		return "http://127.0.0.1:8090"
	}
	return raw
}

func enqueueProducts(items []Product, query string) {
	if len(items) == 0 {
		return
	}
	payload := make([]map[string]any, 0, len(items))
	for _, item := range items {
		id := strings.TrimPrefix(item.ID, "sm-")
		if id == "" || strings.TrimSpace(item.Title) == "" {
			continue
		}
		payload = append(payload, map[string]any{
			"snapp_id":          id,
			"title":             item.Title,
			"price":             item.Price,
			"discount":          item.Discount,
			"subcategory_slug":  item.SubcategorySlug,
			"subcategory_id":    item.SubcategoryID,
			"subcategory_title": item.SubcategoryTitle,
			"category_id":       item.CategoryID,
			"category_title":    item.CategoryTitle,
			"category_slug":     item.CategorySlug,
			"image":             item.Image,
			"query":             query,
			"product_entity":    item.Entity,
		})
	}
	if len(payload) == 0 {
		return
	}
	body, err := json.Marshal(map[string]any{"items": payload})
	if err != nil {
		return
	}
	go postAnalyticsQueue(body)
}

func postAnalyticsQueue(body []byte) {
	req, err := http.NewRequest(http.MethodPost, analyticsURL()+"/queue", bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 3 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return
	}
	res.Body.Close()
}
