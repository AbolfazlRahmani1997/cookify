/** Brand logo assets placed in `public`. */
export const LOGO = {
  /** Full stacked lockup (mark + wordmark + tagline). */
  full: "/logo.png",
  /** Chef-hat mark only, for compact spots. */
  mark: "/logo-mark.png",
} as const;

export interface CategoryBanner {
  id: string;
  title: string;
  src: string;
  to: string;
}

/** Banner assets placed in `public/banners`. */
export const BANNERS = {
  hero: "/banners/hero-home.png",
  community: "/banners/community-banner.png",
  assistant: "/banners/assistant-banner.png",
  appDownload: "/banners/app-download.jpg",
  categories: [
    {
      id: "autumn",
      title: "دستورهای پاییزی گرم و دلپذیر",
      src: "/banners/category-autumn.png",
      to: "/assistant",
    },
    {
      id: "desserts",
      title: "دسرهای خانگی ساده و خوشمزه",
      src: "/banners/category-desserts.png",
      to: "/assistant",
    },
    {
      id: "healthy",
      title: "غذاهای سالم برای سبک زندگی بهتر",
      src: "/banners/category-healthy.png",
      to: "/assistant",
    },
    {
      id: "breakfast",
      title: "صبحانه‌های خوشمزه برای شروع یک روز عالی",
      src: "/banners/category-breakfast.png",
      to: "/assistant",
    },
  ] satisfies CategoryBanner[],
  snapp: [
    "/banners/snapp-market-1.jpg",
    "/banners/snapp-market-2.jpg",
    "/banners/snapp-market-3.jpg",
    "/banners/snapp-market-4.jpg",
    "/banners/snapp-market-5.jpg",
    "/banners/snapp-market-6.jpg",
  ],
} as const;

export function snappBanner(index: number): string {
  return BANNERS.snapp[index % BANNERS.snapp.length];
}
