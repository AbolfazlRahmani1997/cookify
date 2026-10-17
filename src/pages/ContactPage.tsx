import { useState } from "react";
import { Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { useToast } from "@/context/ToastContext";
import { api } from "@/data/api";

export function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.contact(name, email, message);
      toast("پیام شما ثبت شد. به‌زودی پاسخ می‌دهیم.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "ارسال انجام نشد", "error");
    }
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">تماس با ما</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            سوال، پیشنهاد یا گزارش مشکل داری؟ برامون بنویس.
          </p>

          <form onSubmit={submit} className="card mt-6 space-y-4 p-5 sm:p-6">
            <TextField
              label="نام"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="ایمیل"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-bold text-ink">
                پیام
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-7 placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button type="submit">
              <Send className="size-4" />
              ارسال پیام
            </Button>
          </form>
        </div>

        <aside className="space-y-3">
          <div className="card flex items-start gap-3 p-5">
            <Mail className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-ink">ایمیل پشتیبانی</p>
              <p className="mt-1 text-sm text-muted">support@cookify.ir</p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-5">
            <MapPin className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-ink">تهران</p>
              <p className="mt-1 text-sm text-muted">منطقه ۲ — سرویس آزمایشی</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
