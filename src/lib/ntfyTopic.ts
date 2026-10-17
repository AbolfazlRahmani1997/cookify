const TOPIC_KEY = "cookify.ntfyTopic";

function randomTopic(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `cookify-${hex}`;
}

/** Stable per-browser topic so ntfy can deliver cooking nudges to the phone. */
export function getNtfyTopic(): string {
  try {
    const existing = localStorage.getItem(TOPIC_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const topic = randomTopic();
    localStorage.setItem(TOPIC_KEY, topic);
    return topic;
  } catch {
    return randomTopic();
  }
}

export function ntfySubscribeUrl(topic: string, base = "https://ntfy.sh"): string {
  return `${base.replace(/\/$/, "")}/${topic}`;
}
