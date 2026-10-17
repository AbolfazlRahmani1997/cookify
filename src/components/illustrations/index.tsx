import type { SVGProps } from "react";

/** Green market basket full of vegetables — used in the Snapp Market promos. */
export function BasketIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="80" cy="138" rx="52" ry="7" fill="#0f172a" opacity=".08" />
      <path d="M62 44h36l-3-14a8 8 0 0 0-8-7H73a8 8 0 0 0-8 7l-3 14Z" fill="#10B981" opacity=".25" />
      <circle cx="58" cy="34" r="12" fill="#F59E0B" />
      <circle cx="80" cy="28" r="14" fill="#EF4444" />
      <circle cx="102" cy="34" r="12" fill="#84CC16" />
      <circle cx="44" cy="48" r="10" fill="#22C55E" />
      <circle cx="116" cy="48" r="10" fill="#F97316" />
      <path d="M40 52h80l-9 46a14 14 0 0 1-14 12H63a14 14 0 0 1-14-12l-9-46Z" fill="#10B981" />
      <path d="M40 52h80l-2 10H42l-2-10Z" fill="#059669" />
      <path d="M62 68v30M80 68v32M98 68v30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <path d="M56 44c2-8 12-12 20-10M104 44c-2-8-12-12-20-10" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Friendly chef robot — used in the assistant hero banner. */
export function RobotIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 180 170" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="90" cy="160" rx="48" ry="7" fill="#0f172a" opacity=".08" />
      <path d="M90 18v10" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="14" r="6" fill="#10B981" />
      <rect x="44" y="26" width="92" height="70" rx="26" fill="#ffffff" stroke="#E5E7EB" strokeWidth="3" />
      <rect x="56" y="42" width="68" height="38" rx="18" fill="#10B981" opacity=".12" />
      <circle cx="72" cy="61" r="8" fill="#059669" />
      <circle cx="108" cy="61" r="8" fill="#059669" />
      <circle cx="74.5" cy="58.5" r="2.5" fill="#ffffff" />
      <circle cx="110.5" cy="58.5" r="2.5" fill="#ffffff" />
      <path d="M80 74c6 5 14 5 20 0" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
      <rect x="58" y="100" width="64" height="46" rx="20" fill="#ffffff" stroke="#E5E7EB" strokeWidth="3" />
      <circle cx="90" cy="122" r="10" fill="#10B981" />
      <path d="M90 116v12M84 122h12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M122 108c14-4 26 2 30 14" stroke="#E5E7EB" strokeWidth="10" strokeLinecap="round" />
      <path d="M150 122c4 8 2 16-6 20" stroke="#D1D5DB" strokeWidth="6" strokeLinecap="round" />
      <circle cx="147" cy="146" r="10" fill="#F59E0B" />
    </svg>
  );
}

/** Pink camera with veggies — used in the community share promo. */
export function CameraIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="80" cy="138" rx="52" ry="7" fill="#0f172a" opacity=".08" />
      <circle cx="34" cy="112" r="16" fill="#EF4444" />
      <circle cx="30" cy="106" r="4" fill="#22C55E" />
      <circle cx="126" cy="110" r="14" fill="#F97316" />
      <circle cx="132" cy="104" r="5" fill="#84CC16" />
      <path d="M44 62h18l8-12h28l8 12h18a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H44a12 12 0 0 1-12-12V74a12 12 0 0 1 12-12Z" fill="#FB7185" />
      <circle cx="86" cy="92" r="26" fill="#ffffff" />
      <circle cx="86" cy="92" r="18" fill="#F43F5E" opacity=".35" />
      <circle cx="86" cy="92" r="10" fill="#F43F5E" />
      <circle cx="126" cy="72" r="5" fill="#FDE68A" />
    </svg>
  );
}

/** Two friends sharing a plate — used in the invite card. */
export function FriendsIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="80" cy="140" rx="54" ry="6" fill="#0f172a" opacity=".07" />
      <circle cx="48" cy="52" r="18" fill="#FCD34D" />
      <path d="M20 116c0-16 12-28 28-28s28 12 28 28" fill="#10B981" />
      <circle cx="112" cy="52" r="18" fill="#FCA5A5" />
      <path d="M84 116c0-16 12-28 28-28s28 12 28 28" fill="#3B82F6" />
      <circle cx="80" cy="112" r="22" fill="#ffffff" stroke="#E5E7EB" strokeWidth="3" />
      <circle cx="80" cy="112" r="13" fill="#FDE68A" />
      <path d="M70 112h20M80 102v20" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 74c6-6 14-8 22-6M108 74c6-6 14-8 22-6" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

/** Small snapp! market wordmark. */
export function SnappMarketLogo({ className }: { className?: string }) {
  return (
    <div className={className} aria-label="اسنپ‌مارکت">
      <span className="block text-lg font-extrabold leading-none text-[#21AA47]">
        snapp!
      </span>
      <span className="block text-xs font-bold leading-tight text-[#21AA47]">
        market
      </span>
    </div>
  );
}
