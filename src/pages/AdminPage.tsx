import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/data/api";
import type { AdminSummary, CommunityPost, CommunityPostView, ContactMessage, Recipe, User } from "@/data/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/common/Button";
import { RecipeForm } from "@/components/admin/RecipeForm";
import { levelLabel } from "@/lib/access";

type Tab = "overview" | "users" | "recipes" | "posts" | "contacts";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "خلاصه" },
  { id: "users", label: "کاربران" },
  { id: "recipes", label: "دستورها" },
  { id: "posts", label: "دست‌پخت‌ها" },
  { id: "contacts", label: "پیام‌ها" },
];

export function AdminPage() {
  const { ready, user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [posts, setPosts] = useState<CommunityPostView[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  const [creatingRecipe, setCreatingRecipe] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);

  const load = async (next: Tab) => {
    setError(null);
    try {
      if (next === "overview") setSummary(await api.adminSummary());
      if (next === "users") setUsers(await api.getUsers());
      if (next === "recipes") setRecipes(await api.listRecipes({ limit: 100 }));
      if (next === "posts") setPosts(await api.listCommunityPosts());
      if (next === "contacts") setContacts(await api.adminContacts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری نشد");
    }
  };

  useEffect(() => {
    if (ready && user.level === "staff") void load(tab);
  }, [ready, user.level, tab]);

  if (!ready) return null;

  if (user.level !== "staff") {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <div className="card max-w-md space-y-3 p-6 text-center">
          <h1 className="text-xl">بک‌آفیس</h1>
          <p className="text-sm text-muted">فقط حساب staff می‌تواند این بخش را ببیند.</p>
          <p className="text-sm">ورود: admin@cookify.ir / cookify123</p>
          <Link to="/login" className="inline-block text-sm font-bold text-primary">
            ورود
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page space-y-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">بک‌آفیس</h1>
        <span className="text-sm text-muted">{user.name}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
                : "rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-muted"
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {tab === "overview" && summary && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["دستورها", summary.recipes],
            ["کاربران", summary.users],
            ["دست‌پخت‌ها", summary.posts],
            ["پیام تماس", summary.contacts],
          ].map(([label, n]) => (
            <div key={String(label)} className="card p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="text-2xl font-extrabold">{n}</p>
            </div>
          ))}
        </div>
      )}
      {tab === "users" && (
        <ul className="card divide-y divide-line">
          {users.map((row) => (
            <li key={row.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{row.name}</p>
                  <p className="text-xs text-muted">@{row.username}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditingUser(editingUser === row.id ? null : row.id)}>
                  ویرایش
                </Button>
              </div>
              {editingUser === row.id && (
                <UserEditor
                  user={row}
                  onSaved={(next) => {
                    setUsers((prev) => prev.map((u) => (u.id === next.id ? { ...u, ...next } : u)));
                    setEditingUser(null);
                  }}
                  onError={(msg) => setError(msg)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {tab === "recipes" && (
        <div className="space-y-3">
          <Button
            size="sm"
            onClick={() => {
              setCreatingRecipe((v) => !v);
              setEditingRecipe(null);
            }}
          >
            دستور جدید
          </Button>
          {creatingRecipe && (
            <RecipeForm
              onCancel={() => setCreatingRecipe(false)}
              onSaved={(next) => {
                setRecipes((prev) => [next, ...prev.filter((r) => r.id !== next.id)]);
                setCreatingRecipe(false);
              }}
            />
          )}
        <ul className="card divide-y divide-line">
          {recipes.map((row) => (
            <li key={row.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{row.title}</p>
                  <p className="text-xs text-muted">{row.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setCreatingRecipe(false); setEditingRecipe(editingRecipe === row.id ? null : row.id); }}>
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      try {
                        await api.adminDeleteRecipe(row.id);
                        setRecipes((prev) => prev.filter((r) => r.id !== row.id));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "حذف نشد");
                      }
                    }}
                  >
                    حذف
                  </Button>
                </div>
              </div>
              {editingRecipe === row.id && (
                <RecipeForm
                  recipe={row}
                  onCancel={() => setEditingRecipe(null)}
                  onSaved={(next) => {
                    setRecipes((prev) => prev.map((r) => (r.id === next.id ? next : r)));
                    setEditingRecipe(null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
        </div>
      )}
      {tab === "posts" && (
        <ul className="card divide-y divide-line">
          {posts.map((row) => (
            <li key={row.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{row.user?.name}</p>
                  <p className="text-xs text-muted">{row.caption}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingPost(editingPost === row.id ? null : row.id)}>
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      try {
                        await api.adminDeletePost(row.id);
                        setPosts((prev) => prev.filter((p) => p.id !== row.id));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "حذف نشد");
                      }
                    }}
                  >
                    حذف
                  </Button>
                </div>
              </div>
              {editingPost === row.id && (
                <PostEditor
                  post={row}
                  onSaved={(next) => {
                    setPosts((prev) => prev.map((p) => (p.id === row.id ? { ...p, ...next } : p)));
                    setEditingPost(null);
                  }}
                  onError={(msg) => setError(msg)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {tab === "contacts" && (
        <ul className="space-y-3">
          {contacts.length === 0 && <p className="text-sm text-muted">پیامی نیست.</p>}
          {contacts.map((row) => (
            <li key={row.id} className="card p-4">
              <p className="font-bold">
                {row.name} <span className="text-xs font-normal text-muted">{row.email}</span>
              </p>
              <p className="mt-2 text-sm">{row.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const field = "w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm";

function UserEditor({
  user,
  onSaved,
  onError,
}: {
  user: User;
  onSaved: (user: User) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [level, setLevel] = useState<"cook" | "chef" | "staff">(user.level ?? "cook");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          onSaved(await api.adminUpdateUser(user.id, { name, bio, level }));
        } catch (err) {
          onError(err instanceof Error ? err.message : "ذخیره نشد");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="نام" />
      <textarea className={field} value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="بیو" />
      <select className={field} value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
        <option value="cook">{levelLabel("cook")}</option>
        <option value="chef">{levelLabel("chef")}</option>
        <option value="staff">{levelLabel("staff")}</option>
      </select>
      <Button type="submit" size="sm" loading={busy}>ذخیره</Button>
    </form>
  );
}

function PostEditor({
  post,
  onSaved,
  onError,
}: {
  post: CommunityPostView;
  onSaved: (post: Pick<CommunityPost, "caption" | "suggestion" | "rating">) => void;
  onError: (msg: string) => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [suggestion, setSuggestion] = useState(post.suggestion);
  const [rating, setRating] = useState(String(post.rating));
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const next = { caption, suggestion, rating: Number(rating) || post.rating };
          await api.adminUpdatePost(post.id, next);
          onSaved(next);
        } catch (err) {
          onError(err instanceof Error ? err.message : "ذخیره نشد");
        } finally {
          setBusy(false);
        }
      }}
    >
      <textarea className={field} value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} placeholder="متن" />
      <textarea className={field} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={2} placeholder="پیشنهاد" />
      <input className={field} value={rating} onChange={(e) => setRating(e.target.value)} placeholder="امتیاز ۱ تا ۵" />
      <Button type="submit" size="sm" loading={busy}>ذخیره</Button>
    </form>
  );
}
