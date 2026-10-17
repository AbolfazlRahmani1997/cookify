import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Send, Star, Upload, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { SelectField } from "@/components/common/SelectField";
import { TextField } from "@/components/common/TextField";
import { Avatar } from "@/components/common/Avatar";
import { FoodImage } from "@/components/common/FoodImage";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { useCommunity } from "@/context/CommunityContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export function CreateResultPage() {
  const navigate = useNavigate();
  const { publish } = useCommunity();
  const { toast } = useToast();
  const { user, isLoggedIn } = useAuth();
  const recipeList = useAsync(() => api.listRecipes(), []);

  const [recipeId, setRecipeId] = useState("");
  const [caption, setCaption] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [rating, setRating] = useState(5);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری مجاز است.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("حجم تصویر باید کمتر از ۴ مگابایت باشد.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("برای انتشار دست‌پخت وارد حساب شو.");
      return;
    }
    if (!recipeId) {
      setError("لطفاً یک دستور پخت انتخاب کن.");
      return;
    }
    if (!caption.trim()) {
      setError("کپشن نمی‌تواند خالی باشد.");
      return;
    }
    try {
      await publish({
        recipeId,
        caption: caption.trim(),
        suggestion: suggestion.trim(),
        rating,
      });
      toast("دست‌پخت شما منتشر شد");
      navigate("/community");
    } catch (err) {
      setError(err instanceof Error ? err.message : "انتشار انجام نشد.");
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-bold text-primary-dark">
          <ImagePlus className="size-4" />
          ثبت دست‌پخت
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
          نتیجه آشپزی‌ات را به اشتراک بگذار
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          عکس، امتیاز و یک پیشنهاد برای دیگران اضافه کن.
        </p>
      </header>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-5 p-5 sm:p-6">
          <SelectField
            label="دستور پخت"
            name="recipe"
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            disabled={recipeList.loading}
          >
            <option value="">
              {recipeList.loading ? "در حال بارگذاری…" : "یک دستور انتخاب کن"}
            </option>
            {(recipeList.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </SelectField>

          <div>
            <p className="mb-2 text-sm font-bold text-ink">امتیاز شما</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} ستاره`}
                  aria-pressed={rating === star}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "size-7",
                      star <= rating
                        ? "fill-accent text-accent"
                        : "fill-line text-line",
                    )}
                  />
                </button>
              ))}
              <span className="ms-2 text-sm font-bold text-ink">
                {formatNumber(rating)} از ۵
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="caption"
              className="mb-2 block text-sm font-bold text-ink"
            >
              کپشن
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="از تجربه آشپزی‌ات بنویس…"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-7 placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <TextField
            label="پیشنهاد من"
            name="suggestion"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="مثلاً: خامه را کمی کمتر بریزید."
            hint="یک نکته کوتاه که به بهتر شدن نتیجه کمک می‌کند."
          />

          {error && (
            <p role="alert" className="text-sm font-bold text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              <Send className="size-4" />
              انتشار
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/community")}
            >
              انصراف
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold text-ink">پیش‌نمایش پست</h2>
            <div className="flex items-center gap-3">
              <Avatar name={user.name} src={user.avatar} size={40} ring />
              <div>
                <p className="text-sm font-bold text-ink">{user.name}</p>
                <p className="text-[11px] text-muted">همین حالا</p>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-line">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="پیش‌نمایش تصویر دست‌پخت"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    aria-label="حذف تصویر"
                    className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <FoodImage
                  seed={recipeId || "r1"}
                  src={recipeList.data?.find((r) => r.id === recipeId)?.image}
                  alt="پیش‌نمایش دست‌پخت"
                  ratio="aspect-[16/10]"
                />
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-ink">
              {caption || "کپشن شما اینجا نمایش داده می‌شود."}
            </p>
            {suggestion && (
              <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs leading-6 text-ink/90">
                <span className="font-bold">پیشنهاد من: </span>
                {suggestion}
              </p>
            )}
          </div>

          <label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed p-6 text-center transition-colors hover:border-primary/40">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-light text-primary-dark">
              <Upload className="size-6" />
            </span>
            <span className="text-sm font-bold text-ink">
              بارگذاری تصویر غذا
            </span>
            <span className="text-xs text-muted">PNG یا JPG تا ۴ مگابایت</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </aside>
      </form>
    </div>
  );
}
