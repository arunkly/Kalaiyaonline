import { Link, createFileRoute } from "@tanstack/react-router";
import { ArticleCard } from "@/components/article-card";
import { articles } from "@/data/articles";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/saved")({ component: SavedPage });

function SavedPage() {
  const saved = usePrefs((s) => s.saved);
  const items = articles.filter((a) => saved.includes(a.slug));

  return (
    <div>
      <h1 className="font-display text-4xl">सुरक्षित समाचार</h1>
      <p className="mt-2 text-sm text-muted">यो यन्त्रमा मात्र सेभ हुन्छ।</p>
      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-surface px-5 py-12 text-center">
          <p className="font-display text-2xl">अहिले खाली छ</p>
          <p className="mt-2 text-sm text-muted">कुनै रिपोर्ट खोलेर सेभ थिच्नुहोस्।</p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper"
          >
            गृहपृष्ठ
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
