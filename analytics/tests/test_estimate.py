import unittest

from snapp_analytics.analyze import catalog_score, choose_subcategory, estimate_from_packs


class EstimateTest(unittest.TestCase):
    def test_estimate_uses_unit_price_not_pack_price(self):
        packs = [
            {
                "title": "نمک ۵۰۰ گرم",
                "is_grocery": 1,
                "amount_value": 500,
                "amount_unit": "گرم",
                "price_final": 40000,
                "price_per_100g": 8000,
            },
            {
                "title": "نمک ۷۰۰ گرم",
                "is_grocery": 1,
                "amount_value": 700,
                "amount_unit": "گرم",
                "price_final": 49000,
                "price_per_100g": 7000,
            },
            {
                "title": "شامپو بدن نمک دریایی ۳۰۰ میلی لیتر",
                "is_grocery": 0,
                "price_final": 120000,
                "price_per_100g": None,
            },
        ]
        out = estimate_from_packs(packs, amount=10, unit="گرم", ingredient="نمک")
        self.assertEqual(out["estimated_toman"], 750)
        self.assertEqual(out["unit_rate"]["samples"], 2)
        self.assertTrue(all("شامپو" not in (p["title"] or "") for p in out["pack_prices"]))

    def test_recipe_match_uses_saved_category_ids(self):
        breast = {
            "title": "سینه مرغ بدون استخوان 500 گرمی",
            "ingredient_key": "سینه مرغ",
            "is_grocery": 1,
            "snapp_category_id": "731214",
            "snapp_category_title": "پروتیین و تخم مرغ",
            "snapp_subcategory_id": "731297",
            "snapp_subcategory_title": "مرغ",
        }
        schnitzel = {
            "title": "شنیسل سینه مرغ پمینا",
            "ingredient_key": "شنسل مرغ",
            "is_grocery": 1,
            "snapp_category_id": "1",
            "snapp_subcategory_id": "2",
            "snapp_subcategory_title": "غذای نیمه آماده منجمد و یخچالی",
        }
        self.assertGreater(catalog_score("سینه مرغ", breast), 0)
        self.assertEqual(catalog_score("سینه مرغ", schnitzel), -100)
        self.assertEqual(catalog_score("تخم مرغ", breast), -100)

    def test_egg_category_is_not_chicken(self):
        rows = [
            {"id": "731297", "title": "مرغ"},
            {"id": "731295", "title": "تخم مرغ و ماکیان"},
        ]
        chosen = choose_subcategory("تخم مرغ", rows)
        self.assertEqual(chosen["id"], "731295")
        breast_category = choose_subcategory("سینه مرغ", rows)
        self.assertEqual(breast_category["id"], "731297")

    def test_wheat_flour_is_not_chickpea_flour(self):
        wheat = {
            "title": "آرد سفید گندم زر ماکارون 500 گرمی",
            "ingredient_key": "آرد گندم",
            "is_grocery": 1,
            "snapp_category_id": "731207",
            "snapp_subcategory_id": "731254",
        }
        chickpea = {
            "title": "آرد نخودچی رشد 200 گرم",
            "ingredient_key": "آرد نخودچی",
            "is_grocery": 1,
            "snapp_category_id": "731207",
            "snapp_subcategory_id": "731254",
        }
        self.assertGreater(catalog_score("آرد گندم", wheat), 0)
        self.assertEqual(catalog_score("آرد گندم", chickpea), -100)

    def test_prepared_form_is_not_the_raw_ingredient(self):
        milk = {"title": "شیر تازه پگاه 1 لیتری", "ingredient_key": "شیر", "is_grocery": 1}
        cocoa = {"title": "شیر کاکائو میهن 200 میلی", "ingredient_key": "شیر کاکائو", "is_grocery": 1}
        parm = {"title": "پنیر پارمزان کاله 100 گرمی", "ingredient_key": "پنیر پارمزان", "is_grocery": 1}
        cocktail = {"title": "کوکتل پارمسان سولیکو 300 گرمی", "ingredient_key": "پنیر پارمزان", "is_grocery": 1}
        self.assertGreater(catalog_score("شیر", milk), 0)
        self.assertEqual(catalog_score("شیر", cocoa), -100)
        self.assertGreater(catalog_score("پنیر پارمزان", parm), 0)
        self.assertEqual(catalog_score("پنیر پارمزان", cocktail), -100)

    def test_carrot_milk_is_not_carrot(self):
        carrot = {"title": "هویج تازه 1 کیلوگرمی", "ingredient_key": "هویج", "is_grocery": 1}
        milk = {"title": "شیر هویج کم چرب پگاه 200 میلی لیتری", "ingredient_key": "هویج", "is_grocery": 1}
        self.assertGreater(catalog_score("هویج", carrot), 0)
        self.assertEqual(catalog_score("هویج", milk), -100)
