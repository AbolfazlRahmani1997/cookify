import type { User } from "@/data/types";

export const users: User[] = [
  {
    id: "u1",
    username: "sara",
    name: "سارا محمدی",
    bio: "عاشق آشپزی خانگی و شیرینی‌پزی. دستورهای ساده برای شب‌های شلوغ.",
    followers: 1240,
    following: 320,
    resultsCount: 48,
    savedRecipeIds: ["r1", "r4", "r5"],
  },
  {
    id: "u2",
    username: "ali",
    name: "علی رضایی",
    bio: "غذاهای ایرانی و کباب‌ها تخصص من هستند.",
    followers: 860,
    following: 210,
    resultsCount: 31,
    savedRecipeIds: ["r2", "r3"],
  },
  {
    id: "u3",
    username: "nazanin",
    name: "نازنین کریمی",
    bio: "دسر و کیک، همیشه با یک فنجان قهوه.",
    followers: 2100,
    following: 410,
    resultsCount: 72,
    savedRecipeIds: ["r4", "r7"],
  },
  {
    id: "u4",
    username: "mahdi",
    name: "مهدی احمدی",
    bio: "پیتزا و فست‌فود خانگی بدون فست‌فود.",
    followers: 540,
    following: 180,
    resultsCount: 22,
    savedRecipeIds: ["r7", "r1"],
  },
  {
    id: "u5",
    username: "zahra",
    name: "زهرا موسوی",
    bio: "غذاهای سنتی را از مادربزرگم یاد گرفتم.",
    followers: 1750,
    following: 260,
    resultsCount: 55,
    savedRecipeIds: ["r3", "r8", "r9"],
  },
];

export const userById = (id: string) => users.find((u) => u.id === id);
export const userByUsername = (username: string) =>
  users.find((u) => u.username === username);

export const currentUser = users[0];
