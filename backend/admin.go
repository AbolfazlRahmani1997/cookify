package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (a *API) adminSummary(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.AdminSummary())
}

func (a *API) adminContacts(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.Contacts())
}

func (a *API) adminUpdateUser(c *gin.Context) {
	var body struct {
		Name  string `json:"name"`
		Bio   string `json:"bio"`
		Level string `json:"level"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	u, err := a.store.AdminUpdateUser(c.Param("id"), body.Name, body.Bio, strings.TrimSpace(body.Level))
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, u)
}

func (a *API) adminCreateRecipe(c *gin.Context) {
	var draft Recipe
	if err := c.ShouldBindJSON(&draft); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	recipe, err := a.store.CreateRecipe(currentUser(c), draft)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, recipe)
}

func (a *API) adminUpdateRecipe(c *gin.Context) {
	var draft Recipe
	if err := c.ShouldBindJSON(&draft); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	r, err := a.store.UpdateRecipe(c.Param("id"), draft)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, r)
}

func (a *API) adminUpdatePost(c *gin.Context) {
	var body struct {
		Caption    string  `json:"caption"`
		Suggestion string  `json:"suggestion"`
		Rating     float64 `json:"rating"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	p, err := a.store.UpdatePost(c.Param("id"), body.Caption, body.Suggestion, body.Rating)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, p)
}

func (a *API) adminDeleteRecipe(c *gin.Context) {
	if err := a.store.DeleteRecipe(c.Param("id")); err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, gin.H{"ok": true})
}

func (a *API) adminDeletePost(c *gin.Context) {
	if err := a.store.DeletePost(c.Param("id")); err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, gin.H{"ok": true})
}
