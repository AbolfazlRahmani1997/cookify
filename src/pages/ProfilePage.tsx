import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookMarked,
  Camera,
  ChefHat,
  ImagePlus,
  LogOut,
  MessageCircle,
  Pencil,
  Share2,
  UserPlus,
  UserX,
} from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { Tabs } from "@/components/common/Tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Modal } from "@/components/common/Modal";
import { TextField } from "@/components/common/TextField";
import { FoodImage } from "@/components/common/FoodImage";
import { ProfileCookCard } from "@/components/profile/ProfileCookCard";
import { ProfileUserRow } from "@/components/profile/ProfileUserRow";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { getRecipesByIds } from "@/data/selectors";
import { useCommunity } from "@/context/CommunityContext";
import { useFollow } from "@/context/FollowContext";
import { useAuth } from "@/context/AuthContext";
import { useSaved } from "@/context/SavedContext";
import { useToast } from "@/context/ToastContext";
import { formatNumber } from "@/lib/format";
import { canPublishRecipes } from "@/lib/access";
import type { User } from "@/data/types";

export function ProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { posts } = useCommunity();
  const { isFollowing, toggleFollow } = useFollow();
  const { user: me, isLoggedIn, logout, updateProfile, uploadAvatar } = useAuth();
  const { savedRecipes: mySaved } = useSaved();
  const catalog = useAsync(() => api.listRecipes(), []);
  const {
    data: fetched,
    loading,
    error,
    reload,
    setData,
  } = useAsync(() => api.getUser(username), [username]);

  const [tab, setTab] = useState("results");
  const [peopleOpen, setPeopleOpen] = useState<"followers" | "following" | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTab("results");
  }, [username]);

  const user = fetched;
  const following = isFollowing(user?.username ?? "");
  const isMe = Boolean(user && me.id && user.username === me.username);

  const people = useAsync(
    () => {
      if (!peopleOpen || !user) return Promise.resolve([] as User[]);
      return peopleOpen === "followers"
        ? api.listFollowers(user.username)
        : api.listFollowingUsers(user.username);
    },
    [peopleOpen, user?.username],
  );

  const userPosts = useMemo(
    () => (user ? posts.filter((p) => p.userId === user.id) : []),
    [posts, user],
  );

  const savedRecipes = isMe
    ? mySaved.length
      ? mySaved
      : getRecipesByIds(catalog.data ?? [], user?.savedRecipeIds ?? [])
    : [];

  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    userPosts.forEach((p) => {
      counts.set(p.recipe.cuisine, (counts.get(p.recipe.cuisine) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [userPosts]);

  const highlights = useMemo(() => {
    const seen = new Set<string>();
    return userPosts
      .map((p) => p.recipe)
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .slice(0, 6);
  }, [userPosts]);

  const cover = userPosts[0]?.recipe;

  const TABS = [
    { id: "results", label: `دست‌پخت‌ها (${formatNumber(userPosts.length)})` },
    ...(isMe
      ? [{ id: "saved", label: `ذخیره‌شده (${formatNumber(savedRecipes.length)})` }]
      : []),
    { id: "about", label: "درباره" },
  ];

  const pickPhoto = () => photoRef.current?.click();

  const onPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("فقط فایل تصویری مجاز است.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("حجم تصویر باید کمتر از ۲ مگابایت باشد.", "error");
      return;
    }
    try {
      await uploadAvatar(file);
      const next = await api.getUser(username);
      if (next) setData(next);
      toast("عکس پروفایل عوض شد");
    } catch (err) {
      toast(err instanceof Error ? err.message : "آپلود انجام نشد", "error");
    }
  };

  const openEdit = () => {
    if (!user) return;
    setNameDraft(user.name);
    setBioDraft(user.bio);
    setEditOpen(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(nameDraft, bioDraft);
      setData((prev) =>
        prev ? { ...prev, name: nameDraft.trim(), bio: bioDraft.trim() } : prev,
      );
      toast("پروفایل به‌روز شد");
      setEditOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "ذخیره نشد", "error");
    } finally {
      setSaving(false);
    }
  };

  const onFollow = () => {
    if (!user) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const was = following;
    toggleFollow(user.username);
    setData((prev) =>
      prev
        ? {
            ...prev,
            followers: Math.max(0, prev.followers + (was ? -1 : 1)),
          }
        : prev,
    );
  };

  const shareProfile = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: user?.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("لینک پروفایل کپی شد");
    } catch {
      toast("اشتراک‌گذاری انجام نشد", "info");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="skeleton h-36 w-full rounded-none" />
          <div className="flex gap-4 px-5 pb-5">
            <div className="skeleton -mt-10 size-24 rounded-full" />
            <div className="mt-4 flex-1 space-y-3">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-3 w-64" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="skeleton aspect-[4/3] rounded-2xl" />
          <div className="skeleton aspect-[4/3] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={reload} />;

  if (!user) {
    return (
      <EmptyState
        icon={<UserX className="size-7" />}
        title="کاربر پیدا نشد"
        description={`کاربری با نام @${username} وجود ندارد.`}
        action={
          <Link to="/community">
            <Button>بازگشت به جامعه</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-l from-primary to-primary-dark sm:h-44">
          {cover && (
            <FoodImage
              seed={cover.id}
              src={cover.image}
              alt=""
              className="opacity-40"
              ratio="h-full"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
        </div>

        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative -mt-12 shrink-0">
                <Avatar
                  name={user.name}
                  src={isMe ? me.avatar || user.avatar : user.avatar}
                  size={96}
                  className="ring-4 ring-surface"
                />
                {isMe && (
                  <button
                    type="button"
                    onClick={pickPhoto}
                    className="absolute bottom-1 left-1 inline-flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-soft"
                    aria-label="عوض کردن عکس پروفایل"
                  >
                    <Camera className="size-4" />
                  </button>
                )}
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void onPhoto(file);
                }}
              />
              <div className="min-w-0 pb-1 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold text-ink">{user.name}</h1>
                  {canPublishRecipes(user) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-ink">
                      <ChefHat className="size-3" />
                      سرآشپز
                    </span>
                  )}
                  {isMe && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary-dark">
                      پروفایل شما
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">@{user.username}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isMe ? (
                <>
                  <Button variant="secondary" onClick={openEdit}>
                    <Pencil className="size-4" />
                    ویرایش پروفایل
                  </Button>
                  <Link to="/community/create">
                    <Button>
                      <ImagePlus className="size-4" />
                      ثبت دست‌پخت
                    </Button>
                  </Link>
                  {canPublishRecipes(user) && (
                    <Link to="/recipes/new">
                      <Button variant="secondary">
                        <ChefHat className="size-4" />
                        ثبت دستور غذا
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant={following ? "secondary" : "primary"}
                    onClick={onFollow}
                  >
                    <UserPlus className="size-4" />
                    {following ? "دنبال می‌کنی" : "دنبال کردن"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      isLoggedIn ? navigate(`/messages?with=${user.username}`) : navigate("/login")
                    }
                  >
                    <MessageCircle className="size-4" />
                    پیام
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={shareProfile} aria-label="اشتراک پروفایل">
                <Share2 className="size-4" />
              </Button>
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{user.bio}</p>
          )}

          {cuisines.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {cuisines.map(([name]) => (
                <li
                  key={name}
                  className="rounded-full bg-canvas px-3 py-1 text-[11px] font-bold text-muted"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-x-6">
            <button
              type="button"
              className="rounded-2xl bg-canvas px-3 py-2 text-right"
              onClick={() => setPeopleOpen("followers")}
            >
              <dt className="text-[11px] text-muted">دنبال‌کننده</dt>
              <dd className="text-lg font-extrabold text-ink">
                {formatNumber(user.followers)}
              </dd>
            </button>
            <button
              type="button"
              className="rounded-2xl bg-canvas px-3 py-2 text-right"
              onClick={() => setPeopleOpen("following")}
            >
              <dt className="text-[11px] text-muted">دنبال‌شده</dt>
              <dd className="text-lg font-extrabold text-ink">
                {formatNumber(user.following)}
              </dd>
            </button>
            <div className="rounded-2xl bg-canvas px-3 py-2">
              <dt className="text-[11px] text-muted">دست‌پخت</dt>
              <dd className="text-lg font-extrabold text-ink">
                {formatNumber(Math.max(user.resultsCount, userPosts.length))}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {highlights.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-extrabold text-ink">دستورهای این آشپز</h2>
          <ul className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {highlights.map((recipe) => (
              <li key={recipe.id} className="w-28 shrink-0">
                <Link to={`/recipes/${recipe.id}`} className="block">
                  <div className="overflow-hidden rounded-2xl">
                    <FoodImage
                      seed={recipe.id}
                      src={recipe.image}
                      alt={recipe.title}
                      ratio="aspect-square"
                    />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] font-bold text-ink">
                    {recipe.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Tabs items={TABS} active={tab} onChange={setTab} />

      {tab === "results" &&
        (userPosts.length === 0 ? (
          <EmptyState
            icon={<ChefHat className="size-7" />}
            title={isMe ? "اولین دست‌پختت را ثبت کن" : "هنوز دست‌پختی ثبت نشده"}
            description={
              isMe
                ? "عکس بگیر، امتیاز بده و تجربه آشپزی‌ات را با جامعه به اشتراک بگذار."
                : "این کاربر هنوز تجربه آشپزی‌اش را به اشتراک نگذاشته است."
            }
            action={
              isMe ? (
                <Link to="/community/create">
                  <Button>
                    <ImagePlus className="size-4" />
                    ثبت دست‌پخت
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
            {userPosts.map((post) => (
              <ProfileCookCard key={post.id} post={post} />
            ))}
          </div>
        ))}

      {tab === "saved" &&
        (savedRecipes.length === 0 ? (
          <EmptyState
            icon={<BookMarked className="size-7" />}
            title="هنوز چیزی ذخیره نکردی"
            description="روی قلب کارت دستور پخت بزن تا اینجا جمع شود."
            action={
              <Link to="/assistant">
                <Button variant="secondary">کشف دستور پخت‌ها</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {savedRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="card overflow-hidden p-1.5"
              >
                <FoodImage
                  seed={recipe.id}
                  src={recipe.image}
                  alt={recipe.title}
                  ratio="aspect-[4/3]"
                />
                <p className="line-clamp-2 px-1.5 py-2 text-xs font-bold text-ink">
                  {recipe.title}
                </p>
              </Link>
            ))}
          </div>
        ))}

      {tab === "about" && (
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-sm font-extrabold text-ink">درباره {user.name}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {user.bio || "این آشپز هنوز بیویی ننوشته است."}
            </p>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="rounded-2xl bg-canvas px-4 py-3">
              <p className="text-[11px] text-muted">سبک‌های محبوب</p>
              <p className="mt-1 font-bold text-ink">
                {cuisines.map(([n]) => n).join("، ") || "هنوز مشخص نیست"}
              </p>
            </li>
            <li className="rounded-2xl bg-canvas px-4 py-3">
              <p className="text-[11px] text-muted">فعالیت در جامعه</p>
              <p className="mt-1 font-bold text-ink">
                {formatNumber(userPosts.length)} دست‌پخت منتشرشده
              </p>
            </li>
          </ul>
          {isMe && (
            <Button
              variant="secondary"
              onClick={async () => {
                await logout();
                toast("خارج شدی");
                navigate("/");
              }}
            >
              <LogOut className="size-4" />
              خروج از حساب
            </Button>
          )}
        </section>
      )}

      <Modal
        open={Boolean(peopleOpen)}
        onClose={() => setPeopleOpen(null)}
        title={peopleOpen === "followers" ? "دنبال‌کننده‌ها" : "دنبال‌شده‌ها"}
      >
        {people.loading ? (
          <p className="text-sm text-muted">در حال بارگذاری…</p>
        ) : (people.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">هنوز کسی در این فهرست نیست.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(people.data ?? []).map((person) => (
              <li key={person.id}>
                <ProfileUserRow
                  user={person}
                  onPick={() => setPeopleOpen(null)}
                />
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="ویرایش پروفایل"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              انصراف
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              ذخیره
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={pickPhoto}
            className="flex w-full items-center gap-3 rounded-2xl bg-canvas px-3 py-2 text-right"
          >
            <Avatar
              name={user.name}
              src={me.avatar || user.avatar}
              size={56}
            />
            <span>
              <span className="block text-sm font-bold text-ink">عکس پروفایل</span>
              <span className="block text-[11px] text-muted">برای عوض کردن بزن</span>
            </span>
          </button>
          <TextField
            label="نام"
            name="name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
          />
          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-bold text-ink">
              بیو
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-7 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
