package main

import (
	"strconv"
	"strings"
	"unicode"
)

func Recommend(recipes []Recipe, req AssistantRequest) []Recommendation {
	wanted := tokenizeQuery(req.Ingredients)
	out := make([]Recommendation, 0, len(recipes))
	for _, recipe := range recipes {
		names := make([]string, 0, len(recipe.Ingredients))
		for _, ing := range recipe.Ingredients {
			names = append(names, ing.Name)
		}
		matched := []string{}
		titleHits := []string{}
		for _, w := range wanted {
			if recipeTextHit(recipe, w) {
				titleHits = append(titleHits, w)
			}
			for _, n := range names {
				if textHit(n, w) {
					matched = append(matched, w)
					break
				}
			}
		}
		missing := []string{}
		for _, n := range names {
			ok := false
			for _, w := range wanted {
				if textHit(n, w) {
					ok = true
					break
				}
			}
			if !ok {
				missing = append(missing, n)
			}
		}
		if len(wanted) > 0 && len(matched) == 0 && len(titleHits) == 0 {
			continue
		}
		ingredientScore := 0.4
		if len(wanted) > 0 {
			ingredientScore = float64(len(matched)) / float64(len(wanted))
		}
		titleScore := 0.0
		if len(wanted) > 0 {
			titleScore = float64(len(titleHits)) / float64(len(wanted))
		}
		timeScore := 1.0
		if req.TimeMinutes > 0 && recipe.TimeMinutes > req.TimeMinutes {
			timeScore = 1 - float64(recipe.TimeMinutes-req.TimeMinutes)/90
			if timeScore < 0 {
				timeScore = 0
			}
		}
		mealScore := 0.6
		if req.MealType == "" {
			mealScore = 1
		} else if strings.Contains(recipe.Category, req.MealType) {
			mealScore = 1
		} else {
			for _, t := range recipe.Tags {
				if strings.Contains(t, req.MealType) {
					mealScore = 1
					break
				}
			}
		}
		servingsScore := 0.7
		diff := recipe.Servings - req.Servings
		if diff < 0 {
			diff = -diff
		}
		if req.Servings == 0 || diff <= 1 {
			servingsScore = 1
		}
		matchScore := int((titleScore*0.4 + ingredientScore*0.3 + timeScore*0.15 + mealScore*0.1 + servingsScore*0.05) * 100)
		reasons := []string{}
		if len(titleHits) > 0 {
			reasons = append(reasons, "با جستجوی شما هم‌خوان است")
		}
		if len(matched) > 0 {
			reasons = append(reasons, strconv.Itoa(len(matched))+" مورد از مواد شما را دارد")
		}
		if req.TimeMinutes > 0 && recipe.TimeMinutes <= req.TimeMinutes {
			reasons = append(reasons, "در "+strconv.Itoa(recipe.TimeMinutes)+" دقیقه آماده می‌شود")
		}
		if len(missing) > 0 && len(titleHits) == 0 {
			reasons = append(reasons, strconv.Itoa(len(missing))+" قلم دیگر لازم دارد")
		}
		reason := strings.Join(reasons, " • ")
		if reason == "" {
			reason = "پیشنهاد متناسب با سلیقه شما"
		}
		out = append(out, Recommendation{
			Recipe:             recipe,
			MatchScore:         matchScore,
			MatchedIngredients: uniq(matched),
			MissingIngredients: missing,
			Reason:             reason,
		})
	}
	for i := 0; i < len(out); i++ {
		for j := i + 1; j < len(out); j++ {
			if out[j].MatchScore > out[i].MatchScore {
				out[i], out[j] = out[j], out[i]
			}
		}
	}
	if len(out) > 6 {
		out = out[:6]
	}
	return out
}

func tokenizeQuery(parts []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0)
	add := func(s string) {
		s = strings.TrimSpace(s)
		if s == "" || seen[s] {
			return
		}
		seen[s] = true
		out = append(out, s)
	}
	for _, raw := range parts {
		add(raw)
		for _, part := range strings.FieldsFunc(raw, func(r rune) bool {
			return r == ',' || r == '،' || unicode.IsSpace(r)
		}) {
			add(part)
		}
	}
	return out
}

func recipeTextHit(r Recipe, w string) bool {
	if textHit(r.Title, w) || textHit(r.Cuisine, w) || textHit(r.Category, w) || textHit(r.Description, w) {
		return true
	}
	for _, t := range r.Tags {
		if textHit(t, w) {
			return true
		}
	}
	return false
}

func textHit(hay, needle string) bool {
	if hay == "" || needle == "" {
		return false
	}
	return strings.Contains(hay, needle) || (len(needle) >= 2 && strings.Contains(needle, hay))
}

func uniq(in []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(in))
	for _, s := range in {
		if seen[s] {
			continue
		}
		seen[s] = true
		out = append(out, s)
	}
	return out
}
