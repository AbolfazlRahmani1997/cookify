/**
 * Deterministic, offline-safe image placeholders.
 * Real photography will come from the Laravel backend later; until then we
 * generate pleasant SVG "food plate" and "avatar" images from a seed string so
 * the UI never depends on an external image host.
 */

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Palette = {
  table: [string, string];
  rim: string;
  sauce: string;
  food: string[];
  garnish: string;
};

const PALETTES: Palette[] = [
  {
    table: ["#F3E9DA", "#E4D5BF"],
    rim: "#EFE7DA",
    sauce: "#E8A33D",
    food: ["#F97316", "#EA580C", "#FBBF24", "#DC2626", "#FDE68A"],
    garnish: "#15803D",
  },
  {
    table: ["#EAF1E6", "#D6E4D0"],
    rim: "#E9F0E4",
    sauce: "#84CC16",
    food: ["#65A30D", "#16A34A", "#84CC16", "#F59E0B", "#BEF264"],
    garnish: "#065F46",
  },
  {
    table: ["#F6E7E4", "#E8D1CC"],
    rim: "#F2E5E1",
    sauce: "#DC2626",
    food: ["#DC2626", "#B91C1C", "#F59E0B", "#FCA5A5", "#FDE68A"],
    garnish: "#166534",
  },
  {
    table: ["#EDE9F5", "#DAD2EC"],
    rim: "#EDE8F5",
    sauce: "#8B5CF6",
    food: ["#7C3AED", "#9333EA", "#F472B6", "#C4B5FD", "#FDE68A"],
    garnish: "#4D7C0F",
  },
  {
    table: ["#E7EFF7", "#D2E0EE"],
    rim: "#E8EFF6",
    sauce: "#3B82F6",
    food: ["#2563EB", "#1D4ED8", "#F59E0B", "#93C5FD", "#FDE68A"],
    garnish: "#15803D",
  },
  {
    table: ["#F5EDE0", "#E6D8C2"],
    rim: "#F1E9DD",
    sauce: "#C2410C",
    food: ["#C2410C", "#EA580C", "#FACC15", "#9A3412", "#FDE68A"],
    garnish: "#15803D",
  },
];

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

export function foodImage(seed: string, width = 800, height = 600): string {
  const h = hashString(seed);
  const rand = mulberry32(h);
  const p = PALETTES[h % PALETTES.length];

  const cx = width / 2;
  const cy = height / 2;
  const plateR = Math.min(width, height) * 0.38;

  // Sauce base fills most of the plate
  const sauceR = plateR * (0.78 + rand() * 0.1);

  // Food pieces scattered across the sauce
  const blobs: string[] = [];
  const count = 11 + Math.floor(rand() * 7);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.7;
    const dist = sauceR * (0.05 + rand() * 0.72);
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;
    const br = plateR * (0.13 + rand() * 0.17);
    const fill = p.food[Math.floor(rand() * p.food.length)];
    const rot = Math.floor(rand() * 360);
    blobs.push(
      `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${br.toFixed(
        1,
      )}" ry="${(br * (0.75 + rand() * 0.4)).toFixed(1)}" fill="${fill}" transform="rotate(${rot} ${bx.toFixed(
        1,
      )} ${by.toFixed(1)})" opacity="${(0.85 + rand() * 0.15).toFixed(2)}"/>`,
    );
  }

  // Garnish specks + leaf shapes
  const specks: string[] = [];
  const specCount = 18 + Math.floor(rand() * 12);
  for (let i = 0; i < specCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = sauceR * (0.3 + rand() * 0.75);
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    const sr = 2 + rand() * 4;
    specks.push(
      `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(
        1,
      )}" fill="${p.garnish}" opacity="0.85"/>`,
    );
  }
  const leaves: string[] = [];
  const leafCount = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < leafCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = sauceR * (0.45 + rand() * 0.4);
    const lx = cx + Math.cos(angle) * dist;
    const ly = cy + Math.sin(angle) * dist;
    const rot = Math.floor(rand() * 360);
    leaves.push(
      `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(
        1,
      )}" rx="12" ry="6" fill="${p.garnish}" opacity="0.9" transform="rotate(${rot} ${lx.toFixed(
        1,
      )} ${ly.toFixed(1)})"/>`,
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p.table[0]}"/>
        <stop offset="1" stop-color="${p.table[1]}"/>
      </linearGradient>
      <radialGradient id="plate" cx="50%" cy="40%" r="68%">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="${p.rim}"/>
      </radialGradient>
      <radialGradient id="sauce" cx="45%" cy="38%" r="70%">
        <stop offset="0" stop-color="${p.sauce}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="${p.sauce}" stop-opacity="0.7"/>
      </radialGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="${cx}" cy="${cy}" r="${(plateR * 1.14).toFixed(
      1,
    )}" fill="url(#plate)" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${plateR.toFixed(
      1,
    )}" fill="url(#plate)" stroke="${p.rim}" stroke-width="7"/>
    <g clip-path="circle(${plateR.toFixed(1)}px at ${cx}px ${cy}px)">
      <circle cx="${cx}" cy="${cy}" r="${sauceR.toFixed(1)}" fill="url(#sauce)"/>
      ${blobs.join("")}
      ${specks.join("")}
      ${leaves.join("")}
    </g>
    <circle cx="${cx}" cy="${cy}" r="${(plateR * 0.98).toFixed(
      1,
    )}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="12"/>
  </svg>`;

  return svgToDataUri(svg);
}

export function productImage(seed: string, size = 240): string {
  const h = hashString(seed);
  const [c1, c2] = PALETTES[h % PALETTES.length].food;
  const initial = seed.trim().charAt(0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#F1F5F9"/>
      </linearGradient>
    </defs>
    <rect width="240" height="240" fill="url(#pg)"/>
    <rect x="58" y="46" width="124" height="150" rx="16" fill="${c1}" opacity="0.16"/>
    <rect x="70" y="60" width="100" height="122" rx="12" fill="${c1}" opacity="0.35"/>
    <rect x="70" y="60" width="100" height="30" rx="12" fill="${c2}" opacity="0.9"/>
    <text x="120" y="140" text-anchor="middle" font-family="Vazirmatn, Tahoma, Arial, sans-serif" font-size="56" font-weight="800" fill="${c2}">${initial}</text>
  </svg>`;
  return svgToDataUri(svg);
}

const AVATAR_COLORS: [string, string][] = [
  ["#34D399", "#059669"],
  ["#60A5FA", "#2563EB"],
  ["#FBBF24", "#F59E0B"],
  ["#F472B6", "#DB2777"],
  ["#A78BFA", "#7C3AED"],
  ["#FB923C", "#EA580C"],
  ["#2DD4BF", "#0D9488"],
];

export function avatarImage(name: string, size = 128): string {
  const h = hashString(name || "?");
  const [c1, c2] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#g)"/>
    <text x="64" y="64" dy="0.36em" text-anchor="middle" font-family="Vazirmatn, Tahoma, Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff">${initials}</text>
  </svg>`;

  return svgToDataUri(svg);
}
