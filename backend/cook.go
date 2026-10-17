package main

import (
	"log"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var topicPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]{8,64}$`)

type CookSessionRow struct {
	ID            string    `gorm:"primaryKey;size:64" json:"id"`
	Topic         string    `gorm:"index;size:64;not null" json:"topic"`
	RecipeID      string    `gorm:"size:64" json:"recipeId"`
	RecipeTitle   string    `json:"recipeTitle"`
	StepID        string    `gorm:"size:64" json:"stepId"`
	Label         string    `json:"label"`
	Reminder      string    `json:"reminder"`
	TotalMinutes  int       `json:"totalMinutes"`
	EveryMinutes  int       `json:"everyMinutes"`
	StartedAt     time.Time `json:"startedAt"`
	NextNudgeAt   time.Time `json:"nextNudgeAt"`
	EndsAt        time.Time `json:"endsAt"`
	Finished      bool      `json:"finished"`
	SubscribeURL  string    `gorm:"-" json:"subscribeUrl"`
}

type startCookBody struct {
	Topic         string `json:"topic"`
	RecipeID      string `json:"recipeId"`
	RecipeTitle   string `json:"recipeTitle"`
	StepID        string `json:"stepId"`
	Label         string `json:"label"`
	Reminder      string `json:"reminder"`
	TotalMinutes  int    `json:"totalMinutes"`
	EveryMinutes  int    `json:"everyMinutes"`
}

type CookScheduler struct {
	store *Store
	once  sync.Once
}

func (a *API) cookScheduler() *CookScheduler {
	return &CookScheduler{store: a.store}
}

func (s *CookScheduler) Start() {
	s.once.Do(func() {
		go s.loop()
	})
}

func (s *CookScheduler) loop() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		s.tick()
	}
}

func (s *CookScheduler) tick() {
	var rows []CookSessionRow
	if err := s.store.db.Where("finished = ?", false).Find(&rows).Error; err != nil {
		log.Printf("cook tick: %v", err)
		return
	}
	now := time.Now()
	for _, row := range rows {
		if now.Before(row.NextNudgeAt) && now.Before(row.EndsAt) {
			continue
		}
		if !now.Before(row.EndsAt) {
			title := "غذا آماده چک کردن است"
			body := "«" + row.Label + "» تمام شد. " + row.RecipeTitle + " را از روی حرارت بردار."
			if err := publishNtfy(row.Topic, title, body, "cooking,white_check_mark"); err != nil {
				log.Printf("ntfy finish %s: %v", row.ID, err)
			}
			_ = s.store.db.Model(&CookSessionRow{}).Where("id = ?", row.ID).Updates(map[string]any{
				"finished": true,
			}).Error
			continue
		}
		if !now.Before(row.NextNudgeAt) {
			if err := publishNtfy(row.Topic, row.RecipeTitle, row.Reminder, "cooking,alarm_clock"); err != nil {
				log.Printf("ntfy nudge %s: %v", row.ID, err)
			}
			next := now.Add(time.Duration(row.EveryMinutes) * time.Minute)
			if next.After(row.EndsAt) {
				next = row.EndsAt
			}
			_ = s.store.db.Model(&CookSessionRow{}).Where("id = ?", row.ID).Update("next_nudge_at", next).Error
		}
	}
}

func (a *API) startCookSession(c *gin.Context) {
	var body startCookBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه نامعتبر است")
		return
	}
	topic := strings.TrimSpace(body.Topic)
	if !topicPattern.MatchString(topic) {
		writeError(c, http.StatusBadRequest, "موضوع ntfy نامعتبر است")
		return
	}
	if body.TotalMinutes < 1 || body.EveryMinutes < 1 {
		writeError(c, http.StatusBadRequest, "زمان مرحله نامعتبر است")
		return
	}
	if body.EveryMinutes > body.TotalMinutes {
		body.EveryMinutes = body.TotalMinutes
	}
	label := strings.TrimSpace(body.Label)
	if label == "" {
		label = "این مرحله"
	}
	reminder := strings.TrimSpace(body.Reminder)
	if reminder == "" {
		reminder = "این مرحله را یک لحظه چک کن."
	}

	// One active session per topic.
	_ = a.store.db.Where("topic = ? AND finished = ?", topic, false).
		Delete(&CookSessionRow{}).Error

	now := time.Now()
	row := CookSessionRow{
		ID:           newID("cook_"),
		Topic:        topic,
		RecipeID:     strings.TrimSpace(body.RecipeID),
		RecipeTitle:  strings.TrimSpace(body.RecipeTitle),
		StepID:       strings.TrimSpace(body.StepID),
		Label:        label,
		Reminder:     reminder,
		TotalMinutes: body.TotalMinutes,
		EveryMinutes: body.EveryMinutes,
		StartedAt:    now,
		NextNudgeAt:  now.Add(time.Duration(body.EveryMinutes) * time.Minute),
		EndsAt:       now.Add(time.Duration(body.TotalMinutes) * time.Minute),
		Finished:     false,
	}
	if err := a.store.db.Create(&row).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "ثبت جلسه آشپزی ناموفق بود")
		return
	}

	_ = publishNtfy(
		topic,
		"همراه آشپزی روشن شد",
		row.RecipeTitle+" — یادآوری هر چند دقیقه می‌آید. گوشی را خاموش نکن.",
		"cooking,bell",
	)

	row.SubscribeURL = ntfyBaseURL() + "/" + topic
	writeJSON(c, http.StatusCreated, row)
}

func (a *API) stopCookSession(c *gin.Context) {
	id := c.Param("id")
	res := a.store.db.Where("id = ?", id).Delete(&CookSessionRow{})
	if res.Error != nil {
		writeError(c, http.StatusInternalServerError, "حذف ناموفق بود")
		return
	}
	if res.RowsAffected == 0 {
		writeError(c, http.StatusNotFound, "جلسه پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, gin.H{"ok": true})
}

func (a *API) getCookSession(c *gin.Context) {
	topic := strings.TrimSpace(c.Query("topic"))
	if !topicPattern.MatchString(topic) {
		writeError(c, http.StatusBadRequest, "موضوع ntfy نامعتبر است")
		return
	}
	var row CookSessionRow
	err := a.store.db.Where("topic = ? AND finished = ?", topic, false).
		Order("started_at desc").First(&row).Error
	if err != nil {
		writeJSON(c, http.StatusOK, nil)
		return
	}
	row.SubscribeURL = ntfyBaseURL() + "/" + topic
	writeJSON(c, http.StatusOK, row)
}
