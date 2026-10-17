package main

import (
	"sort"
	"strings"
	"unicode"
)

var ingredientQueryAlias = map[string]string{
	"نمک":          "نمک خوراکی",
	"فلفل":         "فلفل سیاه",
	"شکر":          "شکر سفید",
	"روغن":         "روغن مایع",
	"آرد":          "آرد سفید",
	"رب":           "رب گوجه",
	"سیر":          "سیر تازه",
	"پیاز":         "پیاز زرد",
	"برنج":         "برنج ایرانی",
	"پاستا":        "ماکارونی",
	"پارمزان":      "پنیر پارمزان",
	"پنیر پارمزان": "parmesan",
	"پارمسان":      "پنیر پارمزان",
}

var stopwords = map[string]bool{
	"و": true, "با": true, "از": true, "برای": true, "مقدار": true, "لازم": true,
}

var cheeseKinds = []string{
	"پارمزان", "پارمسان", "parmesan", "فتا", "پیتزا", "موزارلا",
	"لیقوان", "گودا", "چدار", "صبحانه",
}

var tokenSynonyms = map[string][]string{
	"پارمزان": {"پارمزان", "پارمسان", "parmesan"},
	"پارمسان": {"پارمزان", "پارمسان", "parmesan"},
	"گندم":    {"گندم", "سفید", "نول"},
}

var notTheIngredient = []string{
	"سوسیس", "کوکتل", "اسنک", "دیپ", "سس ",
}

var nonGrocery = []string{
	"شامپو", "شوینده", "ظرفشویی", "لباسشویی", "نرم کننده", "نرم‌کننده",
	"صابون", "خمیردندان", "خمیر دندان", "آرایش", "لوسیون", "دئودورانت",
	"ادکلن", "عطر ", "پوشک", "نوار بهداشتی", "اصلاح", "غذای سگ", "غذای گربه",
	"حیوانات", "سفیدکننده", "جرمگیر", "جرم‌گیر", "دستمال مرطوب", "پاک کننده",
	"پاک‌کننده", "اسکراب بدن", "شامپو بدن", "کره بدن", "اسپری بدن",
	"ژل شستشو", "مایع دستشویی", "ضدعفونی",
}

var readyMealHints = []string{
	"نیمه آماده", "غذای آماده", "آماده مصرف", "سوخاری",
}

var rawCuts = []string{"سینه", "ران", "فیله"}

var processedProtein = []string{
	"شنسل", "شنیسل", "ناگت", "سوخاری", "کوردن", "استریپ",
	"برگر", "همبرگر", "کباب", "ساندویچ", "کنسرو", "طعمدار",
	"ژامبون", "الویه", "دودی",
}

func foldFa(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "ي", "ی")
	s = strings.ReplaceAll(s, "ك", "ک")
	s = strings.ReplaceAll(s, "‌", " ")
	s = strings.Join(strings.Fields(s), " ")
	return s
}

func containsAny(hay string, needles []string) bool {
	for _, n := range needles {
		if n != "" && strings.Contains(hay, n) {
			return true
		}
	}
	return false
}

func titleTokens(title string) []string {
	var b strings.Builder
	for _, r := range title {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		} else {
			b.WriteByte(' ')
		}
	}
	return strings.Fields(b.String())
}

func hasToken(title, q string) bool {
	q = foldFa(q)
	for _, t := range titleTokens(foldFa(title)) {
		if t == q || strings.HasPrefix(t, q) {
			return true
		}
	}
	return false
}

func specificTokens(query string) []string {
	var out []string
	for _, t := range titleTokens(foldFa(query)) {
		if stopwords[t] || len([]rune(t)) < 3 {
			continue
		}
		out = append(out, t)
	}
	return out
}

func titleHasAll(title string, need []string) bool {
	if len(need) == 0 {
		return true
	}
	t := foldFa(title)
	for _, n := range need {
		alts := tokenSynonyms[n]
		if len(alts) == 0 {
			alts = []string{n}
		}
		ok := false
		for _, a := range alts {
			if strings.Contains(t, a) || hasToken(t, a) {
				ok = true
				break
			}
		}
		if !ok {
			return false
		}
	}
	return true
}

func rivalKindPenalty(query, title string) int {
	q := foldFa(query)
	t := foldFa(title)
	var wanted []string
	for _, k := range cheeseKinds {
		if strings.Contains(q, k) {
			wanted = append(wanted, k)
		}
	}
	if len(wanted) == 0 {
		if strings.Contains(q, "آرد") && !containsAny(q, []string{"نخود", "سوخاری", "برنج", "ذرت", "نشاسته"}) &&
			containsAny(t, []string{"نخود", "سوخاری", "برنج", "ذرت", "نشاسته"}) {
			return -100
		}
		return 0
	}
	for _, k := range cheeseKinds {
		if !strings.Contains(t, k) {
			continue
		}
		ok := false
		for _, w := range wanted {
			if k == w {
				ok = true
				break
			}
			for _, syn := range tokenSynonyms[w] {
				if k == syn {
					ok = true
					break
				}
			}
			for _, syn := range tokenSynonyms[k] {
				if w == syn {
					ok = true
					break
				}
			}
			if ok {
				break
			}
		}
		if !ok {
			return -100
		}
	}
	return 0
}

func processedInsteadOfCut(query, title string) bool {
	q := foldFa(query)
	t := foldFa(title)
	wantsCut := containsAny(q, rawCuts)
	queryIsProcessed := containsAny(q, processedProtein)
	if !wantsCut || queryIsProcessed {
		return false
	}
	return containsAny(t, processedProtein)
}

func searchQueriesForIngredient(name string) []string {
	name = foldFa(name)
	seen := map[string]bool{}
	var out []string
	add := func(q string) {
		q = foldFa(q)
		if q == "" || seen[q] {
			return
		}
		seen[q] = true
		out = append(out, q)
	}
	add(name)
	if alias, ok := ingredientQueryAlias[name]; ok {
		add(alias)
	}
	if strings.Contains(name, "پارمزان") || strings.Contains(name, "پارمسان") {
		add("پنیر پارمزان")
		add("پنیر پارمسان")
		add("پارمسان")
		add("پارمزان")
		add("parmesan")
	}
	if strings.Contains(name, "سینه") && strings.Contains(name, "مرغ") {
		add("سینه مرغ بدون پوست")
		add("سینه بدون استخوان")
		add("سینه مرغ تازه")
		add("سینه مرغ")
	}
	return out
}

func groceryScore(query, title, slug string) int {
	titleN := foldFa(title)
	queryN := foldFa(query)
	if titleN == "" || queryN == "" {
		return -100
	}
	if containsAny(titleN, nonGrocery) {
		return -100
	}
	if hasToken(titleN, "شیر") && !hasToken(queryN, "شیر") {
		return -100
	}
	need := specificTokens(queryN)
	if !titleHasAll(titleN, need) {
		return -100
	}
	if rivalKindPenalty(queryN, titleN) <= -100 {
		return -100
	}
	if processedInsteadOfCut(queryN, titleN) {
		return -100
	}
	slugL := strings.ToLower(slug)
	if containsAny(queryN, rawCuts) && (strings.Contains(slugL, "food-to-go") || strings.Contains(slugL, "frozen-food")) {
		return -100
	}
	if !hasToken(titleN, queryN) && !strings.Contains(titleN, queryN) && len(need) == 0 {
		return -50
	}
	score := 0
	if strings.HasPrefix(titleN, queryN) {
		score += 40
	}
	if hasToken(titleN, queryN) || strings.Contains(titleN, queryN) {
		score += 25
	}
	for _, n := range need {
		if strings.Contains(titleN, n) {
			score += 20
		}
	}
	tokens := titleTokens(titleN)
	if len(tokens) > 0 && (tokens[0] == queryN || strings.HasPrefix(tokens[0], queryN)) {
		score += 20
	}
	if len(tokens) <= 6 {
		score += 8
	}
	if containsAny(titleN, readyMealHints) || containsAny(titleN, notTheIngredient) {
		score -= 40
	}
	if strings.HasPrefix(titleN, "پنیر") && containsAny(queryN, []string{"پارمزان", "پارمسان", "پنیر"}) {
		score += 15
	}
	if strings.HasPrefix(titleN, "سینه") && strings.Contains(queryN, "سینه") {
		score += 20
	}
	if strings.Contains(titleN, "بدون پوست") && strings.Contains(queryN, "سینه") {
		score += 18
	}
	slug = strings.ToLower(slug)
	if strings.Contains(slug, "personal") || strings.Contains(slug, "hygiene") ||
		strings.Contains(slug, "cosmetic") || strings.Contains(slug, "detergent") ||
		strings.Contains(slug, "shampoo") {
		score -= 80
	}
	if strings.Contains(slug, "spice") || strings.Contains(slug, "salt") ||
		strings.Contains(slug, "grocery") || strings.Contains(slug, "oil") ||
		strings.Contains(slug, "rice") || strings.Contains(slug, "chicken") ||
		strings.Contains(slug, "dairy") || strings.Contains(slug, "vegetable") {
		score += 12
	}
	// Staples should be sold by weight, not as body wash (ml).
	staples := map[string]bool{"نمک": true, "شکر": true, "آرد": true, "برنج": true, "فلفل": true}
	if staples[queryN] {
		if strings.Contains(titleN, "میلی لیتر") || strings.Contains(titleN, "میلی‌لیتر") {
			score -= 35
		}
		if strings.Contains(titleN, "گرم") || strings.Contains(titleN, "کیلو") {
			score += 15
		}
		if strings.Contains(titleN, "خوراکی") || strings.Contains(titleN, "طعام") {
			score += 18
		}
	}
	return score
}

func entityAdjust(query, entity string) int {
	e := foldFa(entity)
	q := foldFa(query)
	if e == "" {
		return 0
	}
	if processedInsteadOfCut(q, e) || containsAny(e, nonGrocery) {
		return -100
	}
	if e == q {
		return 55
	}
	if strings.Contains(q, e) || strings.Contains(e, q) {
		return 35
	}
	return -20
}

func scoreSlug(p Product) string {
	if p.SubcategorySlug != "" {
		return p.SubcategorySlug
	}
	return p.Category
}

func pickGroceryMatch(query string, items []Product) (Product, bool) {
	type scored struct {
		p Product
		s int
	}
	var ranked []scored
	q := foldFa(query)
	base := q
	if parts := strings.Fields(q); len(parts) > 0 {
		base = parts[0]
	}
	for _, p := range items {
		s := groceryScore(q, p.Title, scoreSlug(p))
		if len(specificTokens(q)) == 0 {
			if s2 := groceryScore(base, p.Title, scoreSlug(p)); s2 > s {
				s = s2
			}
		}
		adj := entityAdjust(q, p.Entity)
		if adj <= -100 {
			continue
		}
		if s < 20 {
			if adj < 35 || processedInsteadOfCut(q, p.Title) || containsAny(foldFa(p.Title), nonGrocery) {
				continue
			}
			s = adj
		} else {
			s += adj
		}
		ranked = append(ranked, scored{p: p, s: s})
	}
	if len(ranked) == 0 {
		return Product{}, false
	}
	sort.Slice(ranked, func(i, j int) bool { return ranked[i].s > ranked[j].s })
	return ranked[0].p, true
}
