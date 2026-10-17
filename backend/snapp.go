package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

const snappSearchURL = "https://svc.snapp.market/mobile/v3/product-vendors/search"
const snappProductURL = "https://svc.snapp.market/express-search/v1/pb/products/"

type Snapp struct {
	http *http.Client
	lat  string
	lng  string
	udid string

	mu         sync.Mutex
	queryCache map[string]snappCache
	byID       map[string]Product
}

type snappCache struct {
	at    time.Time
	items []Product
}

type snappSearchResponse struct {
	Items []snappItem `json:"items"`
}

type snappItem struct {
	ID               json.Number `json:"id"`
	Title            string      `json:"title"`
	Price            float64     `json:"price"`
	Discount         float64     `json:"discount"`
	CategoryID       int         `json:"category_id"`
	CategoryTitle    string      `json:"category_title"`
	CategorySlug     string      `json:"category_slug"`
	SubcategoryID    int         `json:"subcategory_id"`
	SubcategoryTitle string      `json:"subcategory_title"`
	SubcategorySlug  string      `json:"subcategory_slug"`
	Images           []struct {
		Main  string `json:"main"`
		Thumb string `json:"thumb"`
	} `json:"images"`
}

var unitFromTitle = regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s*(گرم|گرمی|کیلو|کیلوگرم|لیتر|میلی‌?لیتر|عدد)`)

func NewSnapp() *Snapp {
	lat := os.Getenv("SNAPP_LAT")
	if lat == "" {
		lat = "35.757499"
	}
	lng := os.Getenv("SNAPP_LONG")
	if lng == "" {
		lng = "51.317662"
	}
	udid := os.Getenv("SNAPP_UDID")
	if udid == "" {
		udid = "cookify-" + newID("")
	}
	return &Snapp{
		http:       &http.Client{Timeout: 12 * time.Second},
		lat:        lat,
		lng:        lng,
		udid:       udid,
		queryCache: map[string]snappCache{},
		byID:       map[string]Product{},
	}
}

func (s *Snapp) Search(query, lat, lng string, page, size int) ([]Product, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("عبارت جستجو خالی است")
	}
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 20 {
		size = 10
	}
	if lat == "" {
		lat = s.lat
	}
	if lng == "" {
		lng = s.lng
	}
	key := strings.Join([]string{query, lat, lng, strconv.Itoa(page), strconv.Itoa(size)}, "|")
	s.mu.Lock()
	if hit, ok := s.queryCache[key]; ok && time.Since(hit.at) < 3*time.Minute {
		s.mu.Unlock()
		return hit.items, nil
	}
	s.mu.Unlock()

	u, _ := url.Parse(snappSearchURL)
	q := u.Query()
	q.Set("page", strconv.Itoa(page))
	q.Set("query", query)
	q.Set("new_search", "1")
	q.Set("new_design", "0")
	q.Add("superType[]", "4")
	q.Set("size", strconv.Itoa(size))
	q.Set("origin", "sl-search")
	q.Set("source", "2")
	q.Set("personalize", "true")
	q.Set("client", "PWA")
	q.Set("deviceType", "PWA")
	q.Set("appVersion", "1.401.4")
	q.Set("UDID", s.udid)
	q.Set("lat", lat)
	q.Set("long", lng)
	u.RawQuery = q.Encode()

	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
	req.Header.Set("Origin", "https://snapp.market")
	req.Header.Set("Referer", "https://snapp.market/")

	res, err := s.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("اتصال به اسنپ‌مارکت برقرار نشد")
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return nil, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("اسنپ‌مارکت پاسخ نامعتبر داد")
	}
	var parsed snappSearchResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("پاسخ اسنپ‌مارکت خوانده نشد")
	}
	out := make([]Product, 0, len(parsed.Items))
	for _, item := range parsed.Items {
		p := mapSnappItem(item, query)
		out = append(out, p)
	}
	s.enrichProducts(out, lat, lng)
	s.mu.Lock()
	s.queryCache[key] = snappCache{at: time.Now(), items: out}
	for _, p := range out {
		s.byID[p.ID] = p
	}
	s.mu.Unlock()
	enqueueProducts(out, query)
	return out, nil
}

func (s *Snapp) ProductByID(id string) (Product, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.byID[id]
	return p, ok
}

func (s *Snapp) Match(name string) (Product, error) {
	name = foldFa(name)
	var pool []Product
	seen := map[string]bool{}
	for _, q := range searchQueriesForIngredient(name) {
		items, err := s.Search(q, "", "", 1, 20)
		if err != nil {
			continue
		}
		for _, p := range items {
			if seen[p.ID] {
				continue
			}
			seen[p.ID] = true
			pool = append(pool, p)
		}
	}
	if p, ok := pickGroceryMatch(name, pool); ok {
		p.Matches = []string{name}
		s.mu.Lock()
		s.byID[p.ID] = p
		s.mu.Unlock()
		return p, nil
	}
	return Product{}, fmt.Errorf("محصول خوراکی مناسبی پیدا نشد")
}

func (s *Snapp) MatchMany(names []string) []Product {
	seen := map[string]bool{}
	out := make([]Product, 0, len(names))
	sem := make(chan struct{}, 3)
	var mu sync.Mutex
	var wg sync.WaitGroup
	for _, raw := range names {
		name := strings.TrimSpace(raw)
		if name == "" || seen[name] {
			continue
		}
		seen[name] = true
		wg.Add(1)
		sem <- struct{}{}
		go func(name string) {
			defer wg.Done()
			defer func() { <-sem }()
			p, err := s.Match(name)
			if err != nil {
				return
			}
			mu.Lock()
			out = append(out, p)
			mu.Unlock()
		}(name)
	}
	wg.Wait()
	return out
}

type snappProductDetail struct {
	Title            string  `json:"title"`
	BrandTitle       string  `json:"brand_title"`
	MinPrice         float64 `json:"min_price"`
	ProductEntity    string  `json:"product_entity"`
	CategoryID       int     `json:"category_id"`
	CategoryTitle    string  `json:"category_title"`
	CategorySlug     string  `json:"category_slug"`
	SubcategoryID    int     `json:"subcategory_id"`
	SubcategoryTitle string  `json:"subcategory_title"`
	SubcategorySlug  string  `json:"subcategory_slug"`
	Images           []struct {
		Main  string `json:"main"`
		Thumb string `json:"thumb"`
	} `json:"images"`
}

func (s *Snapp) fetchProduct(id, lat, lng string) (snappProductDetail, error) {
	u, err := url.Parse(snappProductURL + url.PathEscape(id))
	if err != nil {
		return snappProductDetail{}, err
	}
	q := u.Query()
	q.Set("client", "PWA")
	q.Set("deviceType", "PWA")
	q.Set("appVersion", "1.402.0")
	q.Set("UDID", s.udid)
	q.Set("lat", lat)
	q.Set("long", lng)
	u.RawQuery = q.Encode()
	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return snappProductDetail{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
	req.Header.Set("Origin", "https://snapp.market")
	req.Header.Set("Referer", "https://snapp.market/")
	res, err := s.http.Do(req)
	if err != nil {
		return snappProductDetail{}, err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return snappProductDetail{}, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return snappProductDetail{}, fmt.Errorf("product %s status %d", id, res.StatusCode)
	}
	var detail snappProductDetail
	if err := json.Unmarshal(body, &detail); err != nil {
		return snappProductDetail{}, err
	}
	return detail, nil
}

func applyProductDetail(p *Product, d snappProductDetail) {
	if entity := foldFa(d.ProductEntity); entity != "" {
		p.Entity = entity
	}
	if d.BrandTitle != "" {
		p.Brand = d.BrandTitle
	}
	if d.SubcategorySlug != "" {
		p.SubcategorySlug = d.SubcategorySlug
	}
	applySnappTaxonomy(p, d.CategoryID, d.CategoryTitle, d.CategorySlug, d.SubcategoryID, d.SubcategoryTitle)
	p.Category = snappCategoryID(p)
	if p.Price == 0 && d.MinPrice > 0 {
		p.Price = int(d.MinPrice + 0.5)
	}
	if p.Title == "" {
		p.Title = d.Title
	}
	if p.Image == "" && len(d.Images) > 0 {
		p.Image = d.Images[0].Main
		if p.Image == "" {
			p.Image = d.Images[0].Thumb
		}
	}
}

func (s *Snapp) enrichProducts(items []Product, lat, lng string) {
	sem := make(chan struct{}, 4)
	var wg sync.WaitGroup
	for i := range items {
		id := strings.TrimPrefix(items[i].ID, "sm-")
		if id == "" {
			continue
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(i int, id string) {
			defer wg.Done()
			defer func() { <-sem }()
			detail, err := s.fetchProduct(id, lat, lng)
			if err != nil {
				return
			}
			applyProductDetail(&items[i], detail)
		}(i, id)
	}
	wg.Wait()
}

func mapSnappItem(item snappItem, query string) Product {
	id := strings.TrimSpace(item.ID.String())
	if id == "" {
		id = newID("sm")
	}
	discount := int(item.Discount + 0.5)
	price := int(item.Price + 0.5)
	if discount < 0 {
		discount = 0
	}
	if discount > price {
		discount = 0
	}
	image := ""
	if len(item.Images) > 0 {
		image = item.Images[0].Main
		if image == "" {
			image = item.Images[0].Thumb
		}
	}
	unit := "بسته"
	if m := unitFromTitle.FindStringSubmatch(item.Title); len(m) == 3 {
		n := strings.TrimSpace(m[1])
		u := strings.TrimSpace(m[2])
		u = strings.ReplaceAll(u, "گرمی", "گرم")
		u = strings.ReplaceAll(u, "کیلوگرم", "کیلو")
		unit = n + " " + u
	}
	matches := []string{}
	if query != "" {
		matches = []string{query}
	}
	p := Product{
		ID:               "sm-" + id,
		Title:            item.Title,
		Brand:            "اسنپ‌مارکت",
		Price:            price,
		Discount:         discount,
		Unit:             unit,
		Availability:     "in-stock",
		CategoryID:       item.CategoryID,
		CategoryTitle:    item.CategoryTitle,
		CategorySlug:     item.CategorySlug,
		SubcategoryID:    item.SubcategoryID,
		SubcategoryTitle: item.SubcategoryTitle,
		SubcategorySlug:  item.SubcategorySlug,
		Image:            image,
		Matches:          matches,
	}
	p.Category = snappCategoryID(&p)
	return p
}

func applySnappTaxonomy(p *Product, categoryID int, categoryTitle, categorySlug string, subcategoryID int, subcategoryTitle string) {
	if categoryID != 0 {
		p.CategoryID = categoryID
	}
	if categoryTitle != "" {
		p.CategoryTitle = categoryTitle
	}
	if categorySlug != "" {
		p.CategorySlug = categorySlug
	}
	if subcategoryID != 0 {
		p.SubcategoryID = subcategoryID
	}
	if subcategoryTitle != "" {
		p.SubcategoryTitle = subcategoryTitle
	}
}

func snappCategoryID(p *Product) string {
	if p.CategoryID > 0 {
		return strconv.Itoa(p.CategoryID)
	}
	if p.SubcategorySlug != "" {
		return p.SubcategorySlug
	}
	return p.Category
}
