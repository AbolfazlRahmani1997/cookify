import type { User } from "@/data/types";

export function canPublishRecipes(user?: Pick<User, "level"> | null) {
  return user?.level === "chef" || user?.level === "staff";
}

export function levelLabel(level?: string) {
  if (level === "staff") return "Cookify";
  if (level === "chef") return "سرآشپز";
  return "آشپز";
}
