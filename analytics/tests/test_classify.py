import unittest

from snapp_analytics.classify import merge_classification, normalize_food_classification, parse_llm_json


class ClassifyMergeTest(unittest.TestCase):
    def test_shampoo_rule_overrides_llm(self):
        llm = {"is_grocery": True, "ingredient_key": "نمک", "form": "raw"}
        out = merge_classification(
            "شامپو بدن جلبک دریایی و نمک دریایی صحت (300 میلی لیتر)",
            "personal-care",
            llm,
        )
        self.assertFalse(out["is_grocery"])
        self.assertEqual(out["form"], "non_grocery")
        self.assertEqual(out["ingredient_key"], "")
        self.assertEqual(out["source"], "rule")

    def test_schnitzel_not_breast(self):
        llm = {"is_grocery": True, "ingredient_key": "سینه مرغ", "form": "raw"}
        out = merge_classification("شنسل سینه مرغ پمینا کاله 540 گرمی", "frozen-food", llm)
        self.assertTrue(out["is_grocery"])
        self.assertEqual(out["form"], "processed")
        self.assertEqual(out["ingredient_key"], "شنسل مرغ")

    def test_llm_parmesan_accepted(self):
        llm = {"is_grocery": True, "ingredient_key": "پنیر پارمزان", "form": "raw"}
        out = merge_classification("پنیر پارمسان پودری کاله 80 گرمی", "cheese", llm)
        self.assertEqual(out["ingredient_key"], "پنیر پارمزان")
        self.assertEqual(out["source"], "llm")

    def test_cream_keeps_dairy_when_model_says_bread(self):
        raw = {
            "name_fa": "خامه",
            "name_en": "Bread",
            "category_fa": "غذا",
            "category_en": "processed_food",
            "confidence": 0.95,
            "needs_review": False,
        }
        out = merge_classification("خامه پگاه 200 گرمی", "dairy", raw)
        self.assertEqual(out["ingredient_key"], "خامه")
        self.assertEqual(out["category_en"], "dairy")
        self.assertEqual(out["category_fa"], "لبنیات")
        self.assertTrue(out["needs_review"])

    def test_prompt_schema_tomato(self):
        raw = {
            "name_fa": "گوجه",
            "name_en": "Tomato",
            "category_fa": "سبزیجات",
            "category_en": "vegetable",
            "confidence": 0.99,
            "needs_review": False,
        }
        out = merge_classification("گوجه", "", raw)
        self.assertEqual(out["ingredient_key"], "گوجه")
        self.assertEqual(out["name_en"], "Tomato")
        self.assertEqual(out["category_en"], "vegetable")
        self.assertEqual(out["source"], "llm")
        self.assertFalse(out["needs_review"])

    def test_low_confidence_needs_review(self):
        raw = {
            "name_fa": "نمک",
            "name_en": "Salt",
            "category_fa": "",
            "category_en": "spice",
            "confidence": 0.7,
            "needs_review": False,
        }
        food = normalize_food_classification(raw, "نمک")
        self.assertTrue(food["needs_review"])
        self.assertEqual(food["category_fa"], "ادویه")

    def test_malformed_model_json_is_ignored(self):
        raw = {"name_fa": ["شنسل مرغ"], "name_en": "Chicken", "category_en": "poultry", "confidence": 0.9}
        self.assertIsNone(normalize_food_classification(raw, "مرغ"))

    def test_parse_fenced_json(self):
        parsed = parse_llm_json('here\n```json\n{"is_grocery": true, "form": "raw"}\n```\n')
        self.assertTrue(parsed["is_grocery"])
        self.assertEqual(parsed["form"], "raw")
