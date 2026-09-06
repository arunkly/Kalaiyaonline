import { Link } from "@tanstack/react-router";
import { ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { isAdminEmail } from "@/lib/admin";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import {
  addStoryComment,
  castStoryVote,
  deleteStoryComment,
  getStoryEngagement,
  type StoryComment,
} from "@/lib/engagement";

export function StoryEngage({ slug }: { slug: string }) {
  const { user } = useCurrentUserState();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const row = await getStoryEngagement({ data: { slug } });
    setLikes(row.likes);
    setDislikes(row.dislikes);
    setMyVote(row.myVote);
    setComments(row.comments);
  }

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [slug]);

  async function vote(value: 1 | -1) {
    if (!user) {
      setError("लाइक वा डिसलाइक गर्न लगइन गर्नुहोस्।");
      return;
    }
    setError(null);
    try {
      await castStoryVote({ data: { slug, value } });
      await refresh();
    } catch {
      setError("भोट सेभ भएन। लगइन गर्नुहोस्।");
    }
  }

  async function onComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("कमेन्ट गर्न लगइन गर्नुहोस्।");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addStoryComment({ data: { slug, body } });
      setBody("");
      await refresh();
    } catch {
      setError("कमेन्ट सेभ भएन।");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteStoryComment({ data: { id } });
      await refresh();
    } catch {
      setError("कमेन्ट मेट्न सकिएन।");
    }
  }

  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void vote(1)}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
            myVote === 1
              ? "border-crimson bg-chip text-crimson"
              : "border-line bg-surface hover:border-crimson",
          )}
        >
          <ThumbsUp className="size-4" />
          लाइक · {likes}
        </button>
        <button
          type="button"
          onClick={() => void vote(-1)}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
            myVote === -1
              ? "border-mark bg-orange-50 text-mark"
              : "border-line bg-surface hover:border-mark",
          )}
        >
          <ThumbsDown className="size-4" />
          डिसलाइक · {dislikes}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="section-title">कमेन्ट</h2>
        {user ? (
          <form onSubmit={onComment} className="mt-4 space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={2}
              rows={3}
              placeholder="तपाईंको प्रतिक्रिया लेख्नुहोस्…"
              className="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-crimson"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {busy ? "पठाउँदै…" : "कमेन्ट गर्नुहोस्"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            कमेन्ट गर्न{" "}
            <Link to="/login" className="font-semibold text-crimson hover:underline">
              लगइन वा सदस्य बन्नुहोस्
            </Link>
            ।
          </p>
        )}
        {error ? <p className="mt-3 text-sm text-mark">{error}</p> : null}
        <ul className="mt-5 divide-y divide-line">
          {comments.length === 0 ? (
            <li className="py-4 text-sm text-muted">पहिलो कमेन्ट लेख्नुहोस्।</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{c.author}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                  </div>
                  {user && (user.id === c.userId || isAdminEmail(user.primaryEmail)) ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(c.id)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-mark"
                      aria-label="कमेन्ट मेट्नुहोस्"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
