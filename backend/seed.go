package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"strings"

	"gorm.io/gorm"
)

func SeedIfEmpty(store *Store, seedFS fs.FS) error {
	var n int64
	store.db.Model(&Recipe{}).Count(&n)
	if n > 0 {
		return nil
	}
	log.Println("seeding postgres from seed/*.json")

	var recipes []Recipe
	var products []Product
	var users []User
	var posts []CommunityPost
	var convos []Conversation
	var notes []AppNotification
	if err := readSeed(seedFS, "seed/recipes.json", &recipes); err != nil {
		return err
	}
	if err := readSeed(seedFS, "seed/products.json", &products); err != nil {
		return err
	}
	if err := readSeed(seedFS, "seed/users.json", &users); err != nil {
		return err
	}
	if err := readSeed(seedFS, "seed/community.json", &posts); err != nil {
		return err
	}
	if err := readSeed(seedFS, "seed/messages.json", &convos); err != nil {
		return err
	}
	if err := readSeed(seedFS, "seed/notifications.json", &notes); err != nil {
		return err
	}

	hash, err := hashPassword(demoPassword)
	if err != nil {
		return err
	}

	return store.db.Transaction(func(tx *gorm.DB) error {
		for i := range recipes {
			if recipes[i].Tags == nil {
				recipes[i].Tags = []string{}
			}
			if recipes[i].Image == "" {
				recipes[i].Image = "/static/food/" + recipes[i].ID + ".jpg"
			}
			if err := tx.Create(&recipes[i]).Error; err != nil {
				return err
			}
		}
		for i := range products {
			if err := tx.Create(&products[i]).Error; err != nil {
				return err
			}
		}
		for i := range users {
			u := users[i]
			u.Email = strings.ToLower(u.Username + "@cookify.ir")
			u.PasswordHash = hash
			if err := tx.Create(&u).Error; err != nil {
				return err
			}
			for _, rid := range users[i].SavedRecipeIDs {
				if err := tx.Create(&SavedRecipe{UserID: u.ID, RecipeID: rid}).Error; err != nil {
					return err
				}
			}
		}
		for i := range posts {
			if posts[i].Comments == nil {
				posts[i].Comments = []Comment{}
			}
			if err := tx.Create(&posts[i]).Error; err != nil {
				return err
			}
		}
		for i := range convos {
			if convos[i].Messages == nil {
				convos[i].Messages = []ChatMessage{}
			}
			if err := tx.Create(&convos[i]).Error; err != nil {
				return err
			}
		}
		for i := range notes {
			if err := tx.Create(&notes[i]).Error; err != nil {
				return err
			}
		}
		for _, item := range defaultShoppingList("u1") {
			if err := tx.Create(&item).Error; err != nil {
				return err
			}
		}
		if err := tx.Create(&Follow{UserID: "u1", Username: "ali"}).Error; err != nil {
			return err
		}
		if err := tx.Create(&Follow{UserID: "u1", Username: "nazanin"}).Error; err != nil {
			return err
		}
		return nil
	})
}

func EnsureRecipeImages(store *Store) error {
	for i := 1; i <= 16; i++ {
		id := fmt.Sprintf("r%d", i)
		want := "/static/food/" + id + ".jpg"
		if err := store.db.Model(&Recipe{}).Where("id = ?", id).Update("image", want).Error; err != nil {
			return err
		}
	}
	return nil
}

func EnsureUserLevels(store *Store) error {
	if err := store.db.Model(&User{}).Where("level = ? OR level IS NULL", "").Update("level", "cook").Error; err != nil {
		return err
	}
	chefs := []string{"sara", "nazanin", "zahra"}
	if err := store.db.Model(&User{}).Where("username IN ?", chefs).Update("level", "chef").Error; err != nil {
		return err
	}
	return EnsureStaff(store)
}

func EnsureStaff(store *Store) error {
	var n int64
	if err := store.db.Model(&User{}).Where("level = ?", "staff").Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	hash, err := hashPassword(demoPassword)
	if err != nil {
		return err
	}
	u := User{
		ID:           "u-staff",
		Username:     "cookify",
		Name:         "کوکیفای",
		Bio:          "حساب بک‌آفیس",
		Email:        "admin@cookify.ir",
		PasswordHash: hash,
		Level:        "staff",
	}
	return store.db.Create(&u).Error
}

func readSeed(fsys fs.FS, name string, dest any) error {
	b, err := fs.ReadFile(fsys, name)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, dest)
}
