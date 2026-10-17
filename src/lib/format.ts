const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function formatNumber(value: number): string {
  return toPersianDigits(new Intl.NumberFormat("en-US").format(value));
}

export function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}

export function formatRating(value: number): string {
  return toPersianDigits(value.toFixed(1));
}

export function formatMinutes(minutes: number): string {
  return `${formatNumber(minutes)} دقیقه`;
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function messageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("fa-IR", sameDay
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
  ).format(date);
}

export function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return "";
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${formatNumber(min)} دقیقه پیش`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${formatNumber(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${formatNumber(days)} روز پیش`;
  return formatDate(iso);
}

export function discountPercent(price: number, discount: number): number {
  if (discount <= 0 || price <= 0) return 0;
  return Math.round((discount / price) * 100);
}
