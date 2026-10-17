package main

import "testing"

func TestEntityNamesTheIngredient(t *testing.T) {
	vague := Product{ID: "1", Title: "بسته پروتئین فروشگاه", Entity: "مرغ"}
	breast := Product{ID: "2", Title: "بسته پروتئین فروشگاه", Entity: "سینه مرغ"}
	got, ok := pickGroceryMatch("سینه مرغ", []Product{vague, breast})
	if !ok || got.ID != breast.ID {
		t.Fatalf("got %#v ok=%v, want entity سینه مرغ", got, ok)
	}
}

func TestPickGroceryMatchSkipsShampoo(t *testing.T) {
	shampoo := Product{
		ID:       "1",
		Title:    "شامپو بدن جلبک دریایی و نمک دریایی صحت (300 میلی لیتر)",
		Category: "personal-care",
	}
	salt := Product{
		ID:       "2",
		Title:    "نمک یددار گلها ۷۰۰ گرم",
		Category: "spice-salt",
	}
	got, ok := pickGroceryMatch("نمک", []Product{shampoo, salt})
	if !ok {
		t.Fatal("expected a grocery match")
	}
	if got.ID != salt.ID {
		t.Fatalf("got %q, want salt", got.Title)
	}
	if groceryScore("نمک", shampoo.Title, shampoo.Category) >= 20 {
		t.Fatal("shampoo should be rejected")
	}
}

func TestPickGroceryMatchParmesanNotFeta(t *testing.T) {
	feta := Product{
		ID:    "1",
		Title: "پنیر فتا دوشه هراز 400 گرمی",
	}
	parm := Product{
		ID:    "2",
		Title: "پنیر پارمسان پودری کاله 80 گرمی",
	}
	got, ok := pickGroceryMatch("پنیر پارمزان", []Product{feta, parm})
	if !ok || got.ID != parm.ID {
		t.Fatalf("got %#v ok=%v, want parmesan", got, ok)
	}
	if _, ok := pickGroceryMatch("پنیر پارمزان", []Product{feta}); ok {
		t.Fatal("feta must not substitute for parmesan")
	}
}

func TestPickGroceryMatchBreastNotSchnitzel(t *testing.T) {
	schnitzel := Product{
		ID:    "1",
		Title: "شنسل مرغ مهیا پروتئین ۴۰۰ گرمی",
	}
	schnitzelBreast := Product{
		ID:    "2",
		Title: "شنسل سینه مرغ سوخاری ۵۰۰ گرمی",
	}
	breast := Product{
		ID:       "3",
		Title:    "سینه مرغ بدون پوست پویا پروتئین 1.8 کیلوگرمی",
		Category: "chicken",
	}
	got, ok := pickGroceryMatch("سینه مرغ", []Product{schnitzel, schnitzelBreast, breast})
	if !ok || got.ID != breast.ID {
		t.Fatalf("got %#v ok=%v, want chicken breast", got, ok)
	}
	if _, ok := pickGroceryMatch("سینه مرغ", []Product{schnitzel, schnitzelBreast}); ok {
		t.Fatal("schnitzel must not substitute for chicken breast")
	}
	turkey := Product{ID: "4", Title: "سینه بوقلمون بدون استخوان چکاد 800 گرمی"}
	got, ok = pickGroceryMatch("سینه مرغ", []Product{turkey, breast})
	if !ok || got.ID != breast.ID {
		t.Fatalf("got %#v, want chicken not turkey", got)
	}
}

func TestWheatFlourBeatsChickpeaFlour(t *testing.T) {
	chickpea := Product{ID: "1", Title: "آرد نخودچی رشد 200 گرمی"}
	wheat := Product{ID: "2", Title: "آرد سفید گندم زر ماکارون 500 گرمی"}
	got, ok := pickGroceryMatch("آرد گندم", []Product{chickpea, wheat})
	if !ok || got.ID != wheat.ID {
		t.Fatalf("got %#v ok=%v, want wheat flour", got, ok)
	}
	if _, ok := pickGroceryMatch("آرد گندم", []Product{chickpea}); ok {
		t.Fatal("chickpea flour must not substitute for wheat flour")
	}
}
