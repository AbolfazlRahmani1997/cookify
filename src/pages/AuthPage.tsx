import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { LogoLockup } from "@/components/layout/Logo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/tonight";
  const { login, register } = useAuth();
  const { toast } = useToast();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(isSignup ? "" : "sara@cookify.ir");
  const [password, setPassword] = useState(isSignup ? "" : "cookify123");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (isSignup) await register(name, email, password);
      else await login(email, password);
      toast(isSignup ? "حساب ساخته شد" : "ورود انجام شد");
      navigate(next.startsWith("/") ? next : "/tonight");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "ورود انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={submit} className="card w-full max-w-md space-y-5 p-6 sm:p-8">
        <div className="text-center">
          <LogoLockup className="mx-auto max-w-[160px]" />
          <h1 className="mt-5 text-2xl font-extrabold text-ink">
            {isSignup ? "ساخت حساب Cookify" : "ورود به Cookify"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isSignup
              ? "با ایمیل و رمز عبور حساب بساز."
              : "ورود آزمایشی: sara@cookify.ir / cookify123"}
          </p>
        </div>

        {isSignup && (
          <TextField
            label="نام"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <TextField
          label="ایمیل"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="رمز عبور"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {formError && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={busy}>
          {isSignup ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
          {isSignup ? "ثبت‌نام" : "ورود"}
        </Button>

        <p className="text-center text-sm text-muted">
          {isSignup ? "حساب داری؟" : "حساب نداری؟"}{" "}
          <Link
            to={`${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}
            className="font-bold text-primary-dark hover:text-primary"
          >
            {isSignup ? "ورود" : "ثبت‌نام"}
          </Link>
        </p>
      </form>
    </div>
  );
}
