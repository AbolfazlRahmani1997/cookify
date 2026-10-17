import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/data/api";
import type { WatchPlan } from "@/lib/cookWatch";
import { formatNumber } from "@/lib/format";
import { getNtfyTopic } from "@/lib/ntfyTopic";
import { useToast } from "@/context/ToastContext";

const STORAGE_KEY = "cookify.cookSession";

export interface CookSession {
  id?: string;
  recipeId: string;
  recipeTitle: string;
  stepId: string;
  label: string;
  reminder: string;
  totalMinutes: number;
  everyMinutes: number;
  startedAt: number;
  nextNudgeAt: number;
  finished: boolean;
  subscribeUrl?: string;
  topic: string;
}

interface CookSessionContextValue {
  session: CookSession | null;
  now: number;
  start: (input: {
    recipeId: string;
    recipeTitle: string;
    stepId: string;
    plan: WatchPlan;
  }) => Promise<void>;
  stop: () => Promise<void>;
  openNtfySubscribe: () => void;
}

const CookSessionContext = createContext<CookSessionContextValue | null>(null);

function readSession(): CookSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookSession;
    if (!parsed?.startedAt || !parsed.stepId) return null;
    if (parsed.finished) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CookSessionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [session, setSession] = useState<CookSession | null>(() => readSession());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  useEffect(() => {
    if (!session || session.finished) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || session.finished) return;

    const elapsed = now - session.startedAt;
    const totalMs = session.totalMinutes * 60_000;

    if (elapsed >= totalMs) {
      toast(
        `«${session.label}» تمام شد. یادآوری روی گوشی هم از ntfy می‌آید.`,
        "success",
      );
      setSession({ ...session, finished: true });
      return;
    }

    if (now >= session.nextNudgeAt) {
      toast(session.reminder, "info");
      setSession({
        ...session,
        nextNudgeAt: now + session.everyMinutes * 60_000,
      });
    }
  }, [now, session, toast]);

  const openNtfySubscribe = useCallback(() => {
    const url =
      session?.subscribeUrl ||
      `https://ntfy.sh/${session?.topic || getNtfyTopic()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [session]);

  const start = useCallback(
    async (input: {
      recipeId: string;
      recipeTitle: string;
      stepId: string;
      plan: WatchPlan;
    }) => {
      const topic = getNtfyTopic();
      const startedAt = Date.now();
      try {
        const remote = await api.startCookSession({
          topic,
          recipeId: input.recipeId,
          recipeTitle: input.recipeTitle,
          stepId: input.stepId,
          label: input.plan.label,
          reminder: input.plan.reminder,
          totalMinutes: input.plan.totalMinutes,
          everyMinutes: input.plan.everyMinutes,
        });
        setSession({
          id: remote.id,
          topic: remote.topic,
          recipeId: remote.recipeId,
          recipeTitle: remote.recipeTitle,
          stepId: remote.stepId,
          label: remote.label,
          reminder: remote.reminder,
          totalMinutes: remote.totalMinutes,
          everyMinutes: remote.everyMinutes,
          startedAt: new Date(remote.startedAt).getTime() || startedAt,
          nextNudgeAt: new Date(remote.nextNudgeAt).getTime() ||
            startedAt + input.plan.everyMinutes * 60_000,
          finished: false,
          subscribeUrl: remote.subscribeUrl,
        });
        setNow(startedAt);
        toast(
          `یادآوری هر ${formatNumber(input.plan.everyMinutes)} دقیقه با ntfy می‌آید. اپ ntfy را به این موضوع وصل کن.`,
          "success",
        );
      } catch {
        setSession({
          topic,
          recipeId: input.recipeId,
          recipeTitle: input.recipeTitle,
          stepId: input.stepId,
          label: input.plan.label,
          reminder: input.plan.reminder,
          totalMinutes: input.plan.totalMinutes,
          everyMinutes: input.plan.everyMinutes,
          startedAt,
          nextNudgeAt: startedAt + input.plan.everyMinutes * 60_000,
          finished: false,
          subscribeUrl: `https://ntfy.sh/${topic}`,
        });
        setNow(startedAt);
        toast(
          "سرور ntfy در دسترس نبود؛ تایمر فقط داخل همین صفحه کار می‌کند.",
          "error",
        );
      }
    },
    [toast],
  );

  const stop = useCallback(async () => {
    const id = session?.id;
    setSession(null);
    if (id) {
      try {
        await api.stopCookSession(id);
      } catch {
        /* local stop is enough */
      }
    }
  }, [session?.id]);

  const value = useMemo(
    () => ({ session, now, start, stop, openNtfySubscribe }),
    [session, now, start, stop, openNtfySubscribe],
  );

  return (
    <CookSessionContext.Provider value={value}>{children}</CookSessionContext.Provider>
  );
}

export function useCookSession() {
  const ctx = useContext(CookSessionContext);
  if (!ctx) throw new Error("useCookSession must be used within CookSessionProvider");
  return ctx;
}
