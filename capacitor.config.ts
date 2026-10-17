import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Emulator → Mac host loopback is 10.0.2.2.
 * Set CAP_SERVER_URL to load the live Vite app (API proxy works; no white screen).
 * Example: CAP_SERVER_URL=http://10.0.2.2:5173 npx cap sync android
 * Leave unset for a packaged release that serves files from dist/.
 */
const liveUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.cookify.app",
  appName: "Cookify",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
    ...(liveUrl ? { url: liveUrl } : {}),
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
