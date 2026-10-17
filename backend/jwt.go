package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"os"
	"strings"
	"time"
)

func jwtSecret() string {
	if secret := strings.TrimSpace(os.Getenv("JWT_SECRET")); secret != "" {
		return secret
	}
	return "cookify-chat-dev"
}

func signChatJWT(user User) string {
	if user.ChatID == 0 {
		return ""
	}
	first, last := user.Name, ""
	if parts := strings.Fields(user.Name); len(parts) > 1 {
		first = parts[0]
		last = strings.Join(parts[1:], " ")
	}
	payload, err := json.Marshal(map[string]any{
		"sub":       user.ID,
		"chat_id":   user.ChatID,
		"username":  user.Username,
		"firstname": first,
		"lastname":  last,
		"avatar":    user.Avatar,
		"exp":       time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	if err != nil {
		return ""
	}
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))
	body := base64.RawURLEncoding.EncodeToString(payload)
	unsigned := header + "." + body
	mac := hmac.New(sha256.New, []byte(jwtSecret()))
	mac.Write([]byte(unsigned))
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
