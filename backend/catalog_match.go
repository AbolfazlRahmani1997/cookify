package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type catalogHit struct {
	SnappID          string  `json:"snapp_id"`
	Title            string  `json:"title"`
	Brand            string  `json:"brand"`
	Price            float64 `json:"price"`
	Discount         float64 `json:"discount"`
	PriceFinal       float64 `json:"price_final"`
	ImageURL         string  `json:"image_url"`
	SubcategorySlug  string  `json:"subcategory_slug"`
	CategoryID       string  `json:"snapp_category_id"`
	CategoryTitle    string  `json:"snapp_category_title"`
	CategorySlug     string  `json:"snapp_category_slug"`
	SubcategoryID    string  `json:"snapp_subcategory_id"`
	SubcategoryTitle string  `json:"snapp_subcategory_title"`
	IngredientKey    string  `json:"ingredient_key"`
	AmountValue      float64 `json:"amount_value"`
	AmountUnit       string  `json:"amount_unit"`
	Query            string  `json:"query"`
}

func matchFromCatalog(names []string) []Product {
	clean := make([]string, 0, len(names))
	for _, name := range names {
		name = strings.TrimSpace(name)
		if name != "" {
			clean = append(clean, name)
		}
	}
	if len(clean) == 0 {
		return nil
	}
	body, err := json.Marshal(map[string]any{"names": clean})
	if err != nil {
		return nil
	}
	req, err := http.NewRequest(http.MethodPost, analyticsURL()+"/catalog/match", bytes.NewReader(body))
	if err != nil {
		return nil
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 8 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil
	}
	var hits []catalogHit
	if err := json.NewDecoder(res.Body).Decode(&hits); err != nil {
		return nil
	}
	out := make([]Product, 0, len(hits))
	for _, hit := range hits {
		if hit.SnappID == "" || hit.Title == "" {
			continue
		}
		price := int(hit.PriceFinal + 0.5)
		if price == 0 {
			price = int(hit.Price + 0.5)
		}
		unit := "بسته"
		if hit.AmountValue > 0 && hit.AmountUnit != "" {
			unit = strconv.FormatFloat(hit.AmountValue, 'f', -1, 64) + " " + hit.AmountUnit
		}
		entity := hit.IngredientKey
		out = append(out, Product{
			ID:               "sm-" + hit.SnappID,
			Title:            hit.Title,
			Brand:            hit.Brand,
			Price:            price,
			Discount:         int(hit.Discount + 0.5),
			Unit:             unit,
			Availability:     "in-stock",
			Category:         firstText(hit.CategoryID, hit.SubcategorySlug),
			CategoryID:       atoiID(hit.CategoryID),
			CategoryTitle:    hit.CategoryTitle,
			CategorySlug:     hit.CategorySlug,
			SubcategoryID:    atoiID(hit.SubcategoryID),
			SubcategoryTitle: hit.SubcategoryTitle,
			SubcategorySlug:  hit.SubcategorySlug,
			Image:            hit.ImageURL,
			Entity:           entity,
			Matches:          []string{hit.Query},
		})
	}
	return out
}

func atoiID(raw string) int {
	n, _ := strconv.Atoi(strings.TrimSpace(raw))
	return n
}

func firstText(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
