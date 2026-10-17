import unittest

from snapp_analytics.preprocess import (
    canonical_ingredient,
    guess_category,
    is_grocery,
    parse_unit,
    preprocess_item,
)
from snapp_analytics.store import category_node_id, save_category_tree


class PreprocessTest(unittest.TestCase):
    def test_shampoo_is_not_grocery(self):
        title = "شامپو بدن جلبک دریایی و نمک دریایی صحت (300 میلی لیتر)"
        self.assertFalse(is_grocery(title))
        self.assertEqual(guess_category(title, "personal-care"), "غیرخوراکی")
        parsed = preprocess_item({"item": {"title": title, "price": 100000, "discount": 0}})
        self.assertEqual(parsed["is_grocery"], 0)
        self.assertEqual(parsed["ingredient_key"], "")
        self.assertEqual(parsed["milliliters"], 300)

    def test_salt_pack_unit_price(self):
        title = "نمک تصفیه یددار طلوع (500 گرم)"
        self.assertTrue(is_grocery(title))
        self.assertEqual(canonical_ingredient(title), "نمک")
        n, unit, grams, ml = parse_unit(title)
        self.assertEqual(n, 500)
        self.assertEqual(unit, "گرم")
        self.assertEqual(grams, 500)
        self.assertIsNone(ml)
        parsed = preprocess_item({"item": {"title": title, "price": 40000, "discount": 0}})
        self.assertEqual(parsed["ingredient_key"], "نمک")
        self.assertEqual(parsed["price_per_100g"], 8000.0)

    def test_product_entity_is_the_ingredient(self):
        parsed = preprocess_item(
            {
                "item": {
                    "title": "سینه مرغ بدون استخوان 500 گرمی",
                    "price": 405000,
                    "discount": 0,
                    "product_entity": "سینه مرغ",
                    "subcategory_slug": "chicken",
                }
            }
        )
        self.assertEqual(parsed["ingredient_key"], "سینه مرغ")
        self.assertEqual(parsed["grams"], 500)

    def test_snapp_category_is_kept(self):
        parsed = preprocess_item(
            {
                "item": {
                    "title": "سینه مرغ بدون استخوان 500 گرمی",
                    "price": 405000,
                    "discount": 0,
                    "product_entity": "سینه مرغ",
                    "category_id": 731214,
                    "category_title": "پروتیین و تخم مرغ",
                    "category_slug": "meat-egg",
                    "subcategory_id": 731297,
                    "subcategory_title": "مرغ",
                    "subcategory_slug": "chicken",
                }
            }
        )
        self.assertEqual(parsed["category"], "پروتیین و تخم مرغ")
        self.assertEqual(parsed["snapp_subcategory_title"], "مرغ")
        self.assertEqual(parsed["snapp_category_slug"], "meat-egg")
        self.assertEqual(parsed["subcategory_slug"], "chicken")


class CategoryTreeTest(unittest.TestCase):
    def test_parent_id_is_unwrapped(self):
        self.assertEqual(category_node_id([731214]), "731214")
        self.assertEqual(category_node_id(731297), "731297")

    def _drop_test_schema(self):
        from snapp_analytics import store

        conn = store.connect()
        conn.execute("DROP SCHEMA IF EXISTS snapp_test CASCADE")
        conn.commit()
        conn.close()

    def test_tree_keeps_snapp_parent_id(self):
        import os

        from snapp_analytics import store

        os.environ["ANALYTICS_SCHEMA"] = "snapp_test"
        self.addCleanup(lambda: os.environ.pop("ANALYTICS_SCHEMA", None))
        self.addCleanup(self._drop_test_schema)
        n = save_category_tree(
            {
                "categories": [
                    {
                        "id": [99999999],
                        "title": "محصولات کالابرگی",
                        "slug": "kalabarg",
                        "sub_categories": [{"id": 731297, "title": "مرغ", "slug": "chicken"}],
                    },
                    {
                        "id": [731214],
                        "title": "پروتیین و تخم مرغ",
                        "slug": "meat-egg",
                        "sub_categories": [{"id": 731297, "title": "مرغ", "slug": "chicken"}],
                    },
                ]
            }
        )
        self.assertGreaterEqual(n, 2)
        conn = store.connect()
        parent = conn.execute("SELECT id, parent_id FROM snapp_categories WHERE id = '731214'").fetchone()
        child = conn.execute("SELECT id, parent_id, slug FROM snapp_categories WHERE id = '731297'").fetchone()
        conn.close()
        self.assertEqual(parent["id"], "731214")
        self.assertIsNone(parent["parent_id"])
        self.assertEqual(child["parent_id"], "731214")
        self.assertEqual(child["slug"], "chicken")
