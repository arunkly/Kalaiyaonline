import { AdsDeskPanel } from "@/components/admin-ads-desk";
import { SettingsDeskPanel } from "@/components/admin-settings-desk";
import { ContactDeskPanel } from "@/components/admin-contact-desk";
import { BloodDeskPanel } from "@/components/admin-blood-desk";
import { DirectoryDeskPanel } from "@/components/admin-directory-desk";
import { GalleryDeskPanel } from "@/components/admin-gallery-desk";
import { UsersDeskPanel } from "@/components/admin-users-desk";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAdminEmail } from "@/lib/admin";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import {
  createCategory,
  createStory,
  deleteCategory,
  listAdminStories,
  listCategories,
  listTrashStories,
  purgeStory,
  restoreStory,
  trashStory,
  updateCategory,
  updateStory,
  type DeskCategory,
  type DeskStory,
} from "@/lib/desk";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function defaultCategory(cats: DeskCategory[]) {
  return cats.find((c) => c.slug === "local")?.slug
    || cats.find((c) => c.slug !== "headline")?.slug
    || cats[0]?.slug
    || "local";
}

type Desk = "news" | "gallery" | "directory" | "blood" | "users" | "ads" | "contact" | "settings";
type Tab = "posts" | "categories" | "trash";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const allowed = isAdminEmail(user?.primaryEmail);
  const [desk, setDesk] = useState<Desk>("news");
  const [tab, setTab] = useState<Tab>("posts");
  const [stories, setStories] = useState<DeskStory[] | null>(null);
  const [trash, setTrash] = useState<DeskStory[] | null>(null);
  const [cats, setCats] = useState<DeskCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("local");
  const [location, setLocation] = useState("कलैया, बारा");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([""]);
  const [catLabel, setCatLabel] = useState("");
  const [editCatId, setEditCatId] = useState<number | null>(null);

  async function refresh() {
    try {
      const [live, bin, sections] = await Promise.all([
        listAdminStories(),
        listTrashStories(),
        listCategories(),
      ]);
      setStories(live);
      setTrash(bin);
      setCats(sections);
      if (!sections.some((c) => c.slug === category)) {
        setCategory(defaultCategory(sections));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "डेस्क लोड भएन।");
    }
  }

  useEffect(() => {
    if (!isPending && user && allowed) {
      void refresh();
    }
  }, [isPending, user, allowed]);

  if (isPending) {
    return <div className="h-40 animate-pulse rounded-md bg-chip" />;
  }
  if (!user) return <RedirectToSignIn />;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-4xl">डेस्क बन्द</h1>
        <p className="mt-3 text-sm text-muted">
          यो खाताले पत्रिका पढ्न सक्छ तर समाचार दाखिला गर्न सक्दैन। सम्पादक
          खाताले लगइन गर्नुहोस्।
        </p>
        <div className="mt-6">
          <UserButton />
        </div>
      </div>
    );
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setBody("");
    setTags("");
    setImageUrl("");
    setGallery([""]);
    setCategory(defaultCategory(cats));
  }

  function startEdit(s: DeskStory) {
    setTab("posts");
    setEditingId(s.id);
    setTitle(s.title);
    setExcerpt(s.excerpt);
    setBody(s.body);
    setCategory(s.category);
    setLocation(s.location);
    setTags(s.tags);
    setImageUrl(s.imageUrl ?? "");
    try {
      const extra = s.galleryUrls ? (JSON.parse(s.galleryUrls) as string[]) : [];
      setGallery(extra.length ? extra : [""]);
    } catch {
      setGallery([""]);
    }
  }

  async function onSaveStory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateStory({
          data: {
            id: editingId,
            title,
            excerpt,
            body,
            category,
            tags,
            imageUrl,
            location: location || "कलैया",
            gallery: gallery.filter((u) => u.trim()),
          },
        });
      } else {
        await createStory({
          data: {
            title,
            excerpt,
            body,
            category,
            tags,
            imageUrl,
            location: location || "कलैया",
            gallery: gallery.filter((u) => u.trim()),
          },
        });
      }
      resetForm();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "समाचार सेभ भएन।";
      setError(
        msg === "Unauthorized"
          ? "सत्र सकियो। फेरि लगइन गर्नुहोस्।"
          : msg,
      );
    } finally {
      setSaving(false);
    }
  }

  async function onTrash(id: number) {
    setError(null);
    try {
      await trashStory({ data: { id } });
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ट्र्यासमा पठाउन सकिएन।");
    }
  }

  async function onRestore(id: number) {
    setError(null);
    try {
      await restoreStory({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "फिर्ता ल्याउन सकिएन।");
    }
  }

  async function onPurge(id: number) {
    setError(null);
    try {
      await purgeStory({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "मेटाउन सकिएन।");
    }
  }

  async function onSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editCatId) {
        await updateCategory({ data: { id: editCatId, label: catLabel } });
      } else {
        await createCategory({ data: { label: catLabel } });
      }
      setCatLabel("");
      setEditCatId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "विभाग सेभ भएन।");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCategory(id: number) {
    setError(null);
    try {
      await deleteCategory({ data: { id } });
      if (editCatId === id) {
        setEditCatId(null);
        setCatLabel("");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "विभाग मेट्न सकिएन।");
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "posts", label: "समाचार", count: stories?.length },
    { id: "categories", label: "विभाग", count: cats.length },
    { id: "trash", label: "ट्र्यास", count: trash?.length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-crimson">
            सम्पादक
          </p>
          <h1 className="mt-1 font-display text-4xl">प्रशासन डेस्क</h1>
          <p className="mt-1 text-sm text-muted">{user.primaryEmail}</p>
        </div>
        <UserButton />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            ["news", "समाचार डेस्क"],
            ["gallery", "ग्यालरी डेस्क"],
            ["directory", "डाइरेक्ट्री डेस्क"],
            ["blood", "रक्तदाता डेस्क"],
            ["users", "प्रयोगकर्ता"],
            ["ads", "विज्ञापन डेस्क"],
            ["contact", "सम्पर्क सन्देश"],
            ["settings", "सेटिङ"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDesk(id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
              desk === id ? "bg-crimson text-paper" : "border border-line bg-surface text-ink-soft",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {desk === "gallery" ? <GalleryDeskPanel /> : null}
      {desk === "directory" ? <DirectoryDeskPanel /> : null}
      {desk === "blood" ? <BloodDeskPanel /> : null}
      {desk === "users" ? <UsersDeskPanel /> : null}
      {desk === "ads" ? <AdsDeskPanel /> : null}
      {desk === "contact" ? <ContactDeskPanel /> : null}
      {desk === "settings" ? <SettingsDeskPanel /> : null}
      {desk === "news" ? (
        <>
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 px-4 py-3 text-sm font-semibold",
              tab === t.id ? "border-b-2 border-crimson text-crimson" : "text-muted",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-mark">{error}</p> : null}

      {tab === "posts" ? (
        <>
          <form onSubmit={onSaveStory} className="space-y-3 rounded-md border border-line bg-surface p-4 sm:p-6">
            <h2 className="font-display text-2xl">
              {editingId ? "समाचार सम्पादन" : "नयाँ समाचार"}
            </h2>
            <label className="block text-sm font-medium">
              शीर्षक
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} />
            </label>
            <label className="block text-sm font-medium">
              सारांश
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="छोटो सारांश लेख्नुहोस्"
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              फिचर्ड तस्बिर (बाह्य लिंक)
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className={field}
              />
            </label>
            {imageUrl.trim() ? (
              <img
                src={imageUrl}
                alt=""
                className="max-h-48 w-full rounded-md border border-line object-cover"
              />
            ) : null}
            <div className="space-y-2">
              <p className="text-sm font-medium">थप तस्बिरहरू (बाह्य लिंक)</p>
              {gallery.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    placeholder="https://..."
                    onChange={(e) =>
                      setGallery((rows) => rows.map((row, idx) => (idx === i ? e.target.value : row)))
                    }
                    className={field + " mt-0"}
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-line px-3 text-sm"
                    onClick={() => setGallery((rows) => rows.filter((_, idx) => idx !== i))}
                  >
                    हटाउनुहोस्
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-crimson"
                onClick={() => setGallery((rows) => [...rows, ""])}
              >
                + तस्बिर थप्नुहोस्
              </button>
            </div>
            <label className="block text-sm font-medium">
              विभाग
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={field}
              >
                {cats.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              विवरण
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={8}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              ट्याग
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="बारा, कलैया"
                className={field}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
              >
                {saving ? "सेभ हुँदै…" : editingId ? "अद्यावधिक गर्नुहोस्" : "प्रकाशन गर्नुहोस्"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm"
                >
                  रद्द
                </button>
              ) : null}
            </div>
          </form>

          <section>
            <h2 className="border-b border-ink pb-2 font-display text-2xl">प्रकाशित समाचार</h2>
            {stories === null ? (
              <p className="mt-4 text-sm text-muted">लोड हुँदै…</p>
            ) : stories.length === 0 ? (
              <p className="mt-4 text-sm text-muted">अहिले केही छैन।</p>
            ) : (
              <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-surface">
                {stories.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {s.imageUrl ? (
                        <img
                          src={s.imageUrl}
                          alt=""
                          className="size-16 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div>
                      <p className="font-display text-xl">{s.title}</p>
                      <p className="text-sm text-muted">
                        {cats.find((c) => c.slug === s.category)?.label ?? s.category}
                      </p>
                      <Link
                        to="/article/$slug"
                        params={{ slug: s.slug }}
                        className="text-sm text-crimson hover:underline"
                      >
                        खोल्नुहोस्
                      </Link>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-crimson"
                      >
                        सम्पादन
                      </button>
                      <button
                        type="button"
                        onClick={() => void onTrash(s.id)}
                        className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-mark hover:text-mark"
                      >
                        ट्र्यास
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {tab === "categories" ? (
        <section className="space-y-4">
          <form
            onSubmit={onSaveCategory}
            className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 sm:flex-row sm:items-end"
          >
            <label className="block min-w-0 flex-1 text-sm font-medium">
              {editCatId ? "विभाग सम्पादन" : "नयाँ विभाग"}
              <input
                value={catLabel}
                onChange={(e) => setCatLabel(e.target.value)}
                required
                placeholder="उदाहरण: शिक्षा"
                className={field}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
              >
                {editCatId ? "अद्यावधिक" : "थप्नुहोस्"}
              </button>
              {editCatId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditCatId(null);
                    setCatLabel("");
                  }}
                  className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm"
                >
                  रद्द
                </button>
              ) : null}
            </div>
          </form>
          <ul className="divide-y divide-line rounded-md border border-line bg-surface">
            {cats.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="font-medium">{c.label}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCatId(c.id);
                      setCatLabel(c.label);
                    }}
                    className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-crimson"
                  >
                    सम्पादन
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteCategory(c.id)}
                    className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-mark hover:text-mark"
                  >
                    मेट्नुहोस्
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "trash" ? (
        <section>
          <h2 className="border-b border-ink pb-2 font-display text-2xl">ट्र्यास</h2>
          <p className="mt-2 text-sm text-muted">
            मेटिएका समाचार यहाँ रहन्छन्। फिर्ता ल्याउन सकिन्छ।
          </p>
          {trash === null ? (
            <p className="mt-4 text-sm text-muted">लोड हुँदै…</p>
          ) : trash.length === 0 ? (
            <p className="mt-4 text-sm text-muted">ट्र्यास खाली छ।</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-surface">
              {trash.map((s) => (
                <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="font-display text-xl">{s.title}</p>
                    <p className="text-sm text-muted">
                      {cats.find((c) => c.slug === s.category)?.label ?? s.category} · {s.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onRestore(s.id)}
                      className="min-h-11 rounded-md bg-crimson px-3 text-sm font-semibold text-paper"
                    >
                      फिर्ता ल्याउनुहोस्
                    </button>
                    <button
                      type="button"
                      onClick={() => void onPurge(s.id)}
                      className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-mark hover:text-mark"
                    >
                      सधैं मेट्नुहोस्
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
        </>
      ) : null}
    </div>
  );
}
