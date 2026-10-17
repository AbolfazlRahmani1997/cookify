import {
  Apple,
  Banana,
  Beef,
  Cake,
  Carrot,
  Cherry,
  Citrus,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Drumstick,
  Egg,
  Fish,
  Grape,
  Ham,
  IceCream,
  Leaf,
  Milk,
  Nut,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Sprout,
  Utensils,
  Wheat,
  Wine,
  type LucideIcon,
} from "lucide-react";

type Rule = { match: string[]; icon: LucideIcon };

const RULES: Rule[] = [
  { match: ["تخم مرغ", "تخم"], icon: Egg },
  { match: ["شیر", "ماست", "خامه", "دوغ"], icon: Milk },
  { match: ["پنیر", "کره", "کشک"], icon: Cookie },
  { match: ["مرغ", "ران", "سینه"], icon: Drumstick },
  { match: ["گوشت", "چرخ‌کرده", "گوسفند", "گوساله"], icon: Beef },
  { match: ["ماهی", "میگو", "آبزی"], icon: Fish },
  { match: ["سوسیس", "کالباس", "همبرگر"], icon: Ham },
  { match: ["برنج", "آرد", "گندم", "جو", "رشته", "نخود", "لوبیا", "حبوبات"], icon: Wheat },
  { match: ["پاستا", "ماکارون", "اسپاگتی", "لازانیا"], icon: Utensils },
  { match: ["پیتزا", "خمیر"], icon: Pizza },
  { match: ["سالاد", "کاهو", "سبزی"], icon: Salad },
  { match: ["سوپ", "آش"], icon: Soup },
  { match: ["ساندویچ", "نان", "تست", "بربری", "سنگک"], icon: Sandwich },
  { match: ["کروسان"], icon: Croissant },
  { match: ["کیک", "شیرینی", "بیسکویت"], icon: Cake },
  { match: ["شکلات", "دسر", "بستنی"], icon: IceCream },
  { match: ["قهوه", "اسپرسو"], icon: Coffee },
  { match: ["نوشابه", "شربت", "آبمیوه", "چای"], icon: CupSoda },
  { match: ["شراب", "نوشیدنی"], icon: Wine },
  { match: ["سیب‌زمینی", "سیب زمینی", "هویج", "پیاز", "سیر", "فلفل دلمه"], icon: Carrot },
  { match: ["گوجه", "خیار", "بادمجان", "کدو", "صیفی"], icon: Apple },
  { match: ["سیب", "انار"], icon: Apple },
  { match: ["موز"], icon: Banana },
  { match: ["پرتقال", "لیمو", "نارنگی"], icon: Citrus },
  { match: ["انگور", "توت", "زرشک", "گیلاس"], icon: Grape },
  { match: ["آلبالو", "گیلاس", "شاتوت"], icon: Cherry },
  { match: ["گردو", "بادام", "پسته", "خشکبار", "فندق"], icon: Nut },
  { match: ["قارچ"], icon: Sprout },
  { match: ["سبزی", "ریحان", "جعفری", "نعنا", "برگ"], icon: Leaf },
  { match: ["زعفران", "ادویه", "نمک", "فلفل", "دارچین"], icon: Sprout },
];

export function foodIcon(name: string): LucideIcon {
  const rule = RULES.find((r) => r.match.some((m) => name.includes(m)));
  return rule?.icon ?? Leaf;
}

const TONES = [
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-500",
  "bg-sky-50 text-sky-600",
  "bg-violet-50 text-violet-600",
  "bg-orange-50 text-orange-600",
];

export function foodTone(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
